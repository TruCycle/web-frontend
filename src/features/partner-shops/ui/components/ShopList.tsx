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
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-3">
                <p className="text-sm text-slate-500">
                    Select a shop to preview details and confirm your preferred shop
                </p>
                <div className="h-px bg-slate-200" />
            </div>

            <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
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
                            'w-full rounded-xl border p-3 text-left transition',
                            selectedShopId === shop.id
                                ? 'border-lime-300 bg-lime-50'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                        )}
                        onClick={() => onSelectShop(shop.id)}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="font-semibold text-slate-900">{shop.name}</h3>
                                <p className="mt-1 text-sm text-slate-500">{shop.address}</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                {shop.distance}
                            </span>
                        </div>
                    </button>
                ))}
                {shops.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                        No shops found matching your search.
                    </div>
                ) : null}
            </div>
        </div>
    );
}
