import { CheckCircle2 } from 'lucide-react';
import type { Shop } from '@/features/partner-shops/types';
import { Button } from '@/shared/ui/button/Button';

interface ShopDetailsProps {
    shop: Shop;
    onPlanHandoff: (shop: Shop) => void;
}

export function ShopDetails({ shop, onPlanHandoff }: ShopDetailsProps) {
    return (
        <div className="rounded-tc-lg border border-tc-brand-line bg-white p-5">
            <div>
                <h2 className="break-words text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">{shop.name}</h2>
                <p className="text-[13px] leading-5 text-tc-brand-muted">{shop.postcode}</p>
            </div>

            <div className="mt-4 space-y-4">
                <div>
                    <h4 className="text-xs font-semibold tracking-[0.06em] text-tc-brand-muted">LOCATION</h4>
                    <p className="mt-1 text-sm leading-5 text-tc-brand-ink">{shop.address}</p>
                    <p className="text-sm leading-5 text-tc-brand-body">{shop.distance}</p>
                </div>

                <div>
                    <h4 className="text-xs font-semibold tracking-[0.06em] text-tc-brand-muted">OPENING HOURS</h4>
                    <p className="mt-1 text-sm leading-5 text-tc-brand-ink">{shop.openingHours}</p>
                </div>

                <div>
                    <h4 className="text-xs font-semibold tracking-[0.06em] text-tc-brand-muted">ACCEPTED ITEMS</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {shop.acceptedItems.length === 0 ? <p className="text-sm leading-5 text-tc-brand-body">Ask the shop which items it accepts before planning a handoff.</p> : null}
                        {shop.acceptedItems.map((item) => (
                            <span key={item} className="rounded-full bg-tc-brand-soft px-2.5 py-1 text-xs font-semibold text-tc-brand-body">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                {shop.amenities.length > 0 ? <div>
                    <h4 className="text-xs font-semibold tracking-[0.06em] text-tc-brand-muted">AMENITIES</h4>
                    <div className="mt-2 space-y-2">
                        {shop.amenities.map((amenity) => (
                            <div key={amenity} className="flex items-center gap-2 text-sm text-tc-brand-ink">
                                <CheckCircle2 size={16} className="shrink-0 text-tc-brand-deep" />
                                <span>{amenity}</span>
                            </div>
                        ))}
                    </div>
                </div> : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
                {shop.directionsUrl ? <a href={shop.directionsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center rounded-tc-md border border-tc-brand-control bg-white px-4 text-sm font-semibold text-tc-brand-deep no-underline transition hover:bg-tc-brand-soft">Get directions</a> : null}
                <Button onClick={() => onPlanHandoff(shop)}>Plan Handoff Here</Button>
            </div>
        </div>
    );
}
