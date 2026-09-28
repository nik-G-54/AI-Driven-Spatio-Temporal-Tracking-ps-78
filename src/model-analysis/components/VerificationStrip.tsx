import type { VerificationStripData } from '../model-analysis.api';
import { classNames, getVariantStyle } from '../model-analysis.utils';

interface VerificationStripProps {
  verification: VerificationStripData;
}

export default function VerificationStrip({ verification }: VerificationStripProps) {
  return (
    <div className="xl:col-span-7 bg-white rounded-xl shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-headline-sm text-[#0F172A] font-bold">Super-Resolution Verification Strip</h3>
          <p className="text-body-sm text-[#475569]">Ground Truth Radar vs NWP 12km vs AI Diffusion 5km</p>
        </div>
        <span className="font-mono text-code-sm text-[#475569]">Event: {verification.eventContext}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {verification.images.map((image) => {
          const badgeStyle = getVariantStyle(image.badgeVariant);
          return (
            <div key={image.id} className="flex flex-col gap-2">
              <div
                className={classNames(
                  'relative aspect-square rounded-lg overflow-hidden bg-[#F8FAFC] flex flex-col justify-between p-3',
                  image.highlighted && 'ring-2 ring-black',
                )}
              >
                <img
                  className="absolute inset-0 w-full h-full object-cover"
                  src={image.imageUrl}
                  alt={image.altText}
                />
                <span
                  className={classNames(
                    'relative z-10 self-start text-[10px] px-2 py-0.5 rounded font-bold shadow-sm',
                    image.highlighted ? 'bg-black text-white' : 'bg-white text-[#0F172A]',
                  )}
                >
                  {image.label}
                </span>
                <div
                  className={classNames(
                    'relative z-10 self-start font-mono text-[10px] px-1.5 py-0.5 rounded',
                    badgeStyle.bg,
                    badgeStyle.text,
                  )}
                >
                  Peak: {image.peakValue} {image.peakUnit}
                </div>
              </div>
              <span
                className={classNames(
                  'font-mono text-[11px] text-center',
                  image.highlighted ? 'text-[#0F172A] font-semibold' : 'text-[#475569]',
                )}
              >
                {image.caption}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded-lg font-mono text-code-sm">
        <span className="text-[#475569]">Mean Absolute Error (MAE):</span>
        <div className="flex items-center gap-4">
          <span className="text-[#475569]">
            NWP 12km: <strong className="text-[#EF4444] font-semibold">{verification.meanAbsoluteError.nwp12kmMm} mm</strong>
          </span>
          <span className="text-[#475569]">|</span>
          <span className="text-[#0F172A]">
            AI 5km:{' '}
            <strong className="text-[#16A34A] font-semibold">
              {verification.meanAbsoluteError.ai5kmMm} mm ({verification.meanAbsoluteError.percentChange}%)
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
