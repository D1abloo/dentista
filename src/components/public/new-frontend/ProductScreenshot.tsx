type Props = {
  src: string
  alt: string
  frame?: 'laptop' | 'phone'
}

/** Marco de dispositivo con captura real del producto. */
export function ProductScreenshot({ src, alt, frame = 'laptop' }: Props) {
  return (
    <div className={`ac-device-frame ac-device-frame--${frame} ac-device-frame--module`}>
      {frame === 'laptop' ? (
        <div className="ac-device-frame__chrome" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      ) : (
        <div className="ac-device-frame__notch" aria-hidden />
      )}
      <img src={src} alt={alt} className="ac-device-frame__shot" loading="lazy" decoding="async" />
    </div>
  )
}
