/**
 * A small device drawn in CSS with the case study's real screen in it: the
 * close's companion, and the stage's still image when WebGL is not there.
 * Same build as the 3D object (bone face, ash shell), no second WebGL canvas.
 */
export function DeviceMock({ kind, src, className = "" }: { kind: "phone" | "laptop"; src: string; className?: string }) {
  if (kind === "laptop") {
    return (
      <div className={`v3-mock v3-mock--laptop ${className}`} aria-hidden="true">
        <span className="v3-mock__shadow" />
        <div className="v3-mock__body">
          <div className="v3-mock__lid">
            <div className="v3-mock__screen">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" />
            </div>
          </div>
          <div className="v3-mock__deck" />
        </div>
      </div>
    );
  }
  return (
    <div className={`v3-mock v3-mock--phone ${className}`} aria-hidden="true">
      <span className="v3-mock__shadow" />
      <div className="v3-mock__body">
        <span className="v3-mock__side" />
        <div className="v3-mock__face">
          <div className="v3-mock__screen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" />
            <i className="v3-mock__island" />
          </div>
        </div>
      </div>
    </div>
  );
}
