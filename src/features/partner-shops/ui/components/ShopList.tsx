import { Search } from 'lucide-react';
import { classNames } from '@/shared/utils/classNames';
import type { Shop } from '@/features/partner-shops/types';

interface ShopListProps {
    shops: Shop[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedShopId: string;
    onSelectShop: (id: string) => void;
}

export function ShopList({
    shops,
    searchQuery,
    onSearchChange,
    selectedShopId,
    onSelectShop,
}: ShopListProps) {
    return (
        <div className="rounded-tc-lg border border-tc-brand-line bg-white p-5">
            <div className="space-y-3">
                <p className="text-sm leading-5 text-tc-brand-body">
                    Select a shop to preview details and confirm your preferred shop
                </p>
                <div className="h-px bg-tc-brand-line" />
            </div>

            <div className="relative mt-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tc-brand-muted" size={18} />
                <input
                    type="text"
                    className="h-11 w-full rounded-full border border-tc-brand-control bg-white pl-10 pr-4 text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
                    placeholder="Search shops by name, location, or postcode"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {shops.map((shop) => (
                    <button
                        key={shop.id}
                        className={classNames(
                            'w-full rounded-tc-md border p-3 text-left transition',
                            selectedShopId === shop.id
                                ? 'border-tc-brand-mintLine bg-tc-brand-mintSoft'
                                : 'border-tc-brand-line bg-white hover:border-tc-brand-control hover:bg-tc-brand-soft',
                        )}
                        onClick={() => onSelectShop(shop.id)}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="font-semibold text-tc-brand-ink">{shop.name}</h3>
                                <p className="mt-1 text-sm leading-5 text-tc-brand-body">{shop.address}</p>
                            </div>
                            <span className="shrink-0 rounded-full border border-tc-brand-line bg-white px-2.5 py-1 text-xs font-semibold text-tc-brand-body">
                                {shop.distance}
                            </span>
                        </div>
                    </button>
                ))}
                {shops.length === 0 ? (
                    <div className="rounded-tc-md border border-dashed border-tc-brand-control bg-white px-4 py-3.5 text-sm text-tc-brand-body">
                        No shops found matching your search.
                    </div>
                ) : null}
            </div>
        </div>
    );
}
