/**
 * pg-client.ts — a Neon-backed, Supabase-shaped query builder.
 *
 * WHY THIS EXISTS
 * The content-engine Supabase project shares an org with the trading and scraper
 * tables, so its egress quota gets burned by work that has nothing to do with the
 * site. When it trips, the REST API returns 402 and every course surface — the
 * waitlist, both payment webhooks, the Telegram course gate — fails together.
 * Neon holds the same data (row counts verified identical on 2026-08-16).
 *
 * WHY IT MIMICS SUPABASE INSTEAD OF BEING REWRITTEN AS SQL
 * The nine call sites include both payment webhooks and the course gate. Rewriting
 * them by hand is where money gets lost. This speaks the exact subset of the
 * Supabase builder those files already use, so they do not change at all and a
 * rollback is one import.
 *
 * SUPPORTED (everything the nine call sites use, and nothing else):
 *   .from(t).select(cols?) .insert(rows) .update(obj) .upsert(rows,{onConflict})
 *   .delete()
 *   filters: .eq .neq .is .not(col,'is',null) .ilike .in
 *   modifiers: .order(col,{ascending}) .limit(n) .single() .maybeSingle()
 *
 * Returns { data, error } and never throws, matching Supabase. If you need an
 * operator that is not here, ADD IT — do not silently fall back.
 */
import { neon } from "@neondatabase/serverless";

type Row = Record<string, unknown>;
type Result<T = Row[]> = { data: T | null; error: { message: string } | null };

function sqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (Neon)");
  return neon(url);
}

const ident = (s: string) => `"${String(s).replace(/"/g, '""')}"`;

type Filter = { sql: string; params: unknown[] };

class Builder implements PromiseLike<Result> {
  private table: string;
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private cols = "*";
  private payload: Row[] = [];
  private setObj: Row = {};
  private onConflict?: string;
  private filters: Filter[] = [];
  private orderBy?: string;
  private limitN?: number;
  private rowMode: "many" | "single" | "maybe" = "many";
  private wantReturning = false;

  constructor(table: string) {
    this.table = table;
  }

  select(cols?: string) {
    if (this.op === "select") this.cols = cols?.trim() || "*";
    else this.wantReturning = true;          // .insert(...).select()
    return this;
  }
  insert(rows: Row | Row[]) {
    this.op = "insert";
    this.payload = Array.isArray(rows) ? rows : [rows];
    return this;
  }
  update(obj: Row) {
    this.op = "update";
    this.setObj = obj;
    return this;
  }
  upsert(rows: Row | Row[], opts?: { onConflict?: string }) {
    this.op = "upsert";
    this.payload = Array.isArray(rows) ? rows : [rows];
    this.onConflict = opts?.onConflict;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }

  eq(col: string, v: unknown)   { this.filters.push({ sql: `${ident(col)} = ?`, params: [v] }); return this; }
  neq(col: string, v: unknown)  { this.filters.push({ sql: `${ident(col)} <> ?`, params: [v] }); return this; }
  ilike(col: string, v: string) { this.filters.push({ sql: `${ident(col)} ILIKE ?`, params: [v] }); return this; }
  in(col: string, vs: unknown[]) {
    if (!vs.length) { this.filters.push({ sql: "false", params: [] }); return this; }
    this.filters.push({ sql: `${ident(col)} IN (${vs.map(() => "?").join(",")})`, params: vs });
    return this;
  }
  is(col: string, v: null | boolean) {
    this.filters.push({ sql: `${ident(col)} IS ${v === null ? "NULL" : v ? "TRUE" : "FALSE"}`, params: [] });
    return this;
  }
  // Range comparisons. Only .gte() is currently called (graph/scan counts the
  // last 7 days of runs), but a missing operator here throws at request time in
  // production, and all four are the same one line, so they go in together.
  gt(col: string, v: unknown)  { this.filters.push({ sql: `${ident(col)} > ?`,  params: [v] }); return this; }
  gte(col: string, v: unknown) { this.filters.push({ sql: `${ident(col)} >= ?`, params: [v] }); return this; }
  lt(col: string, v: unknown)  { this.filters.push({ sql: `${ident(col)} < ?`,  params: [v] }); return this; }
  lte(col: string, v: unknown) { this.filters.push({ sql: `${ident(col)} <= ?`, params: [v] }); return this; }

  /** Supabase's .not(col, 'is', null) — the only negation form used here. */
  not(col: string, operator: string, v: null | boolean) {
    if (operator !== "is") throw new Error(`pg-client: .not() supports only 'is', got '${operator}'`);
    this.filters.push({ sql: `${ident(col)} IS NOT ${v === null ? "NULL" : v ? "TRUE" : "FALSE"}`, params: [] });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy = `${ident(col)} ${opts?.ascending === false ? "DESC" : "ASC"}`;
    return this;
  }
  limit(n: number) { this.limitN = n; return this; }
  single() { this.rowMode = "single"; this.limitN = this.limitN ?? 2; return this; }
  maybeSingle() { this.rowMode = "maybe"; this.limitN = this.limitN ?? 2; return this; }

  private where(params: unknown[]) {
    if (!this.filters.length) return "";
    const parts = this.filters.map((f) => {
      let s = f.sql;
      for (const p of f.params) { params.push(p); s = s.replace("?", `$${params.length}`); }
      return s;
    });
    return ` WHERE ${parts.join(" AND ")}`;
  }

  private build(): { text: string; params: unknown[] } {
    const params: unknown[] = [];
    const T = ident(this.table);

    if (this.op === "select") {
      let text = `SELECT ${this.cols === "*" ? "*" : this.cols} FROM ${T}${this.where(params)}`;
      if (this.orderBy) text += ` ORDER BY ${this.orderBy}`;
      if (this.limitN != null) text += ` LIMIT ${this.limitN}`;
      return { text, params };
    }

    if (this.op === "insert" || this.op === "upsert") {
      const keys = [...new Set(this.payload.flatMap((r) => Object.keys(r)))];
      const tuples = this.payload.map(
        (r) => `(${keys.map((k) => { params.push(r[k] ?? null); return `$${params.length}`; }).join(",")})`
      );
      let text = `INSERT INTO ${T} (${keys.map(ident).join(",")}) VALUES ${tuples.join(",")}`;
      if (this.op === "upsert") {
        const conflict = (this.onConflict || "id").split(",").map((c) => ident(c.trim())).join(",");
        const updates = keys.filter((k) => !this.onConflict?.split(",").map((c) => c.trim()).includes(k));
        text += updates.length
          ? ` ON CONFLICT (${conflict}) DO UPDATE SET ${updates.map((k) => `${ident(k)}=EXCLUDED.${ident(k)}`).join(",")}`
          : ` ON CONFLICT (${conflict}) DO NOTHING`;
      }
      if (this.wantReturning) text += " RETURNING *";
      return { text, params };
    }

    if (this.op === "update") {
      const keys = Object.keys(this.setObj);
      const sets = keys.map((k) => { params.push(this.setObj[k] ?? null); return `${ident(k)}=$${params.length}`; });
      let text = `UPDATE ${T} SET ${sets.join(",")}${this.where(params)}`;
      if (this.wantReturning) text += " RETURNING *";
      return { text, params };
    }

    let text = `DELETE FROM ${T}${this.where(params)}`;
    if (this.wantReturning) text += " RETURNING *";
    return { text, params };
  }

  async run(): Promise<Result> {
    try {
      const { text, params } = this.build();
      const rows = (await sqlClient().query(text, params)) as Row[];
      if (this.rowMode === "single") {
        if (rows.length !== 1)
          return { data: null, error: { message: `expected 1 row, got ${rows.length}` } };
        return { data: rows[0] as unknown as Row[], error: null };
      }
      if (this.rowMode === "maybe") {
        return { data: (rows[0] ?? null) as unknown as Row[], error: null };
      }
      return { data: rows, error: null };
    } catch (e) {
      return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
    }
  }

  then<A = Result, B = never>(
    onfulfilled?: ((v: Result) => A | PromiseLike<A>) | null,
    onrejected?: ((r: unknown) => B | PromiseLike<B>) | null
  ): PromiseLike<A | B> {
    return this.run().then(onfulfilled, onrejected);
  }
}

export function pgFrom(table: string) {
  return new Builder(table);
}

/** Shaped like a Supabase client for the subset the course surfaces use. */
export function createPgClient() {
  return { from: (table: string) => new Builder(table) };
}
