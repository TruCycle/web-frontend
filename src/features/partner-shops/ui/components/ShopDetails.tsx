import { CheckCircle2 } from 'lucide-react';
import type { Shop } from '@/features/partner-shops/types';
import { Button } from '@/shared/ui/button/Button';

interface ShopDetailsProps {
    shop: Shop;
    onPlanHandoff: (shop: Shop) => void;
}

export function ShopDetails({ shop, onPlanHandoff }: ShopDetailsProps) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">{shop.name}</h2>
                <p className="text-sm text-slate-500">{shop.postcode}</p>
            </div>

            <div className="mt-4 space-y-4">
                <div>
                    <h4 className="text-xs font-semibold tracking-wide text-slate-500">LOCATION</h4>
                    <p className="mt-1 text-sm text-slate-800">{shop.address}</p>
                    <p className="text-sm text-slate-500">{shop.distance}</p>
                </div>

                <div>
                    <h4 className="text-xs font-semibold tracking-wide text-slate-500">OPENING HOURS</h4>
                    <p className="mt-1 text-sm text-slate-800">{shop.openingHours}</p>
                </div>

                <div>
                    <h4 className="text-xs font-semibold tracking-wide text-slate-500">ACCEPTED ITEMS</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {shop.acceptedItems.map((item) => (
                            <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-semibold tracking-wide text-slate-500">AMENITIES</h4>
                    <div className="mt-2 space-y-2">
                        {shop.amenities.map((amenity) => (
                            <div key={amenity} className="flex items-center gap-2 text-sm text-slate-700">
                                <CheckCircle2 size={16} className="text-lime-600" />
                                <span>{amenity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="secondary">Get Direction</Button>
                <Button onClick={() => onPlanHandoff(shop)}>Plan Handoff Here</Button>
            </div>
        </div>
    );
}
