// Test stand-in for next/headers: a cookie jar the test controls through globalThis.__TEST_COOKIES.
type Jar = Record<string, string | undefined>;
const jar = (): Jar => ((globalThis as unknown as { __TEST_COOKIES?: Jar }).__TEST_COOKIES ?? {});

export async function cookies() {
  return {
    get(name: string) {
      const v = jar()[name];
      return v === undefined ? undefined : { name, value: v };
    },
    set() {},
    delete() {},
  };
}

export async function headers() {
  return new Headers();
}
