import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Upload, Plus, Clock, MapPin, QrCode, Search } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../button/Button';
import { CustomSelect } from '@/shared/ui/select';
import successIcon from '@/assets/images/success.svg';
import { classNames } from '@/shared/utils/classNames';
import { useAuthSession } from '@/shared/context/useAuthSession';
import { apiRequest } from '@/shared/lib/api/client';
import { unwrapApiData } from '@/shared/lib/api/envelope';
import { env } from '@/shared/lib/config/env';

interface ListItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedShop?: ListItemDialogShop | null;
}

export interface ListItemDialogShop {
  readonly id: string;
  readonly name: string;
  readonly postcode: string;
  readonly address: string;
}

interface CreateItemRequest {
  readonly title: string;
  readonly description?: string;
  readonly condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  readonly category: string;
  readonly images?: readonly {
    readonly url: string;
    readonly altText?: string;
  }[];
  readonly address_line: string;
  readonly postcode: string;
  readonly pickup_option: 'donate' | 'exchange';
  readonly dropoff_location_id?: string;
  readonly size_unit: 'm';
  readonly size_length: number;
  readonly size_breadth: number;
  readonly size_height: number;
  readonly weight_kg: number;
}

interface CreatedPickupLocation {
  readonly title: string;
  readonly address: string;
}

interface UploadedPhoto {
  readonly id: string;
  readonly previewUrl: string;
  readonly cloudinaryUrl: string | null;
  readonly deleteToken: string | null;
  readonly isUploading: boolean;
  readonly error: string | null;
}

const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Clothing',
  'Books',
  'Sports Equipment',
  'Home Decor',
  'Other',
];

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : null;
}

function stripWrappingQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, '');
}

const cloudinaryCloudName = stripWrappingQuotes(env.cloudinaryCloudName.trim());
const cloudinaryUploadPreset = stripWrappingQuotes(env.cloudinaryUploadPreset.trim());
const cloudinaryFolder = stripWrappingQuotes(env.cloudinaryFolder.trim());

function getCloudinaryUploadUrl(): string {
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudinaryCloudName)}/image/upload`;
}

function getCloudinaryDeleteUrl(): string {
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudinaryCloudName)}/delete_by_token`;
}

function hasCloudinaryConfig(): boolean {
  return cloudinaryCloudName.length > 0 && cloudinaryUploadPreset.length > 0;
}

async function uploadPhotoToCloudinary(file: File): Promise<{
  readonly cloudinaryUrl: string;
  readonly deleteToken: string | null;
}> {
  if (!hasCloudinaryConfig()) {
    throw new Error('Image upload is not configured. Missing Cloudinary env values.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryUploadPreset);
  formData.append('return_delete_token', 'true');

  if (cloudinaryFolder) {
    formData.append('folder', cloudinaryFolder);
  }

  const response = await fetch(getCloudinaryUploadUrl(), {
    method: 'POST',
    body: formData,
  });
  const payload = asRecord(await response.json().catch(() => null));
  if (!response.ok) {
    const uploadError = asRecord(payload?.error);
    throw new Error(
      readString(uploadError?.message) ?? 'Unable to upload this image right now.',
    );
  }

  const cloudinaryUrl =
    readString(payload?.secure_url) ?? readString(payload?.url);
  if (!cloudinaryUrl) {
    throw new Error('Image upload succeeded but no hosted URL was returned.');
  }

  return {
    cloudinaryUrl,
    deleteToken: readString(payload?.delete_token),
  };
}

async function deletePhotoFromCloudinary(deleteToken: string): Promise<void> {
  if (!deleteToken || !cloudinaryCloudName) {
    return;
  }

  const response = await fetch(getCloudinaryDeleteUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ token: deleteToken }).toString(),
  });

  if (!response.ok) {
    throw new Error('Unable to delete uploaded image from Cloudinary.');
  }
}

const inputClassName =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-lime-400 focus:ring-4 focus:ring-lime-100';

export const ListItemDialog: React.FC<ListItemDialogProps> = ({
  isOpen,
  onClose,
  preselectedShop = null,
}) => {
  const { user } = useAuthSession();
  const [locationType, setLocationType] = useState<'address' | 'shop'>(
    preselectedShop ? 'shop' : 'address',
  );
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [pickupAddressLine, setPickupAddressLine] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [nearbyShops, setNearbyShops] = useState<ListItemDialogShop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [shopsError, setShopsError] = useState<string | null>(null);

  const [createdQrCodeUrl, setCreatedQrCodeUrl] = useState<string | null>(null);
  const [createdPickupLocation, setCreatedPickupLocation] = useState<CreatedPickupLocation | null>(null);
  const [qrDownloadError, setQrDownloadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const removedPhotoIdsRef = useRef<Set<string>>(new Set());

  const selectedConditionLabel =
    CONDITIONS.find((condition) => condition.value === selectedCondition)?.label ?? '';
  const hasUploadingPhotos = photos.some((photo) => photo.isUploading);

  const selectedShop = useMemo(() => {
    if (!selectedShopId) {
      return null;
    }

    const match = nearbyShops.find((shop) => shop.id === selectedShopId);
    if (match) {
      return match;
    }

    if (preselectedShop?.id === selectedShopId) {
      return preselectedShop;
    }

    return null;
  }, [nearbyShops, preselectedShop, selectedShopId]);

  const filteredShops = useMemo(() => {
    const normalizedQuery = shopSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return nearbyShops;
    }

    return nearbyShops.filter(
      (shop) =>
        shop.name.toLowerCase().includes(normalizedQuery) ||
        shop.postcode.toLowerCase().includes(normalizedQuery) ||
        shop.address.toLowerCase().includes(normalizedQuery),
    );
  }, [nearbyShops, shopSearchQuery]);

  const fetchNearbyShops = async (postcode: string) => {
    const normalizedPostcode = postcode.trim();
    if (!normalizedPostcode) {
      setNearbyShops([]);
      setShopsError('Your profile postcode is required to load nearby partner shops.');
      return;
    }

    try {
      setIsLoadingShops(true);
      setShopsError(null);
      const response = await apiRequest<unknown>(
        `/shops/nearby?postcode=${encodeURIComponent(normalizedPostcode)}&radius_m=5000`,
      );
      const data = unwrapApiData<unknown>(response);
      const shopsData = Array.isArray(data) ? data : [];
      const mapped = shopsData
        .map((entry) => {
          const shop = asRecord(entry);
          if (!shop) {
            return null;
          }

          const id = readString(shop.id);
          const name = readString(shop.name);
          if (!id || !name) {
            return null;
          }

          return {
            id,
            name,
            postcode: readString(shop.postcode) ?? 'N/A',
            address: readString(shop.address_line) ?? 'Address unavailable',
          } satisfies ListItemDialogShop;
        })
        .filter((shop): shop is ListItemDialogShop => shop !== null);

      setNearbyShops(mapped);
    } catch (error) {
      setNearbyShops([]);
      setShopsError(
        error instanceof Error
          ? error.message
          : 'Unable to load nearby partner shops right now.',
      );
    } finally {
      setIsLoadingShops(false);
    }
  };

  const resetFormState = () => {
    photos.forEach((photo) => {
      URL.revokeObjectURL(photo.previewUrl);
    });
    removedPhotoIdsRef.current.clear();
    setPhotos([]);
    setSelectedCategory('');
    setSelectedCondition('');
    setItemName('');
    setItemDescription('');
    setPickupAddressLine('');
    setIsSuccess(false);
    setIsSubmitting(false);
    setSubmitError(null);
    setCreatedQrCodeUrl(null);
    setCreatedPickupLocation(null);
    setQrDownloadError(null);
    setShopsError(null);
    setShopSearchQuery(preselectedShop?.name ?? '');
    setSelectedShopId(preselectedShop?.id ?? '');
    setLocationType(preselectedShop ? 'shop' : 'address');
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (preselectedShop) {
      setLocationType('shop');
      setSelectedShopId(preselectedShop.id);
      setShopSearchQuery('');
    }
  }, [isOpen, preselectedShop]);

  useEffect(() => {
    if (!isOpen || locationType !== 'shop') {
      return;
    }

    const postcode = user?.postcode?.trim() ?? '';
    void fetchNearbyShops(postcode);
  }, [isOpen, locationType, user?.postcode]);

  useEffect(() => {
    if (!preselectedShop || nearbyShops.some((shop) => shop.id === preselectedShop.id)) {
      return;
    }

    setNearbyShops((current) => [preselectedShop, ...current]);
  }, [nearbyShops, preselectedShop]);

  const cleanupDraftUploads = async (draftPhotos: readonly UploadedPhoto[]) => {
    const photosToDelete = draftPhotos.filter((photo) => photo.deleteToken);
    if (photosToDelete.length === 0) {
      return;
    }

    await Promise.allSettled(
      photosToDelete.map((photo) => deletePhotoFromCloudinary(photo.deleteToken ?? '')),
    );
  };

  const handleClose = () => {
    if (!isSuccess) {
      void cleanupDraftUploads(photos);
    }
    resetFormState();
    onClose();
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const availableSlots = Math.max(0, 4 - photos.length);
    if (availableSlots === 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (!hasCloudinaryConfig()) {
      setSubmitError(
        'Image upload is unavailable. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.',
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const selectedFiles = Array.from(files).slice(0, availableSlots);
    const nextPhotos = selectedFiles.map((file) => {
      const id = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

      return {
        id,
        previewUrl: URL.createObjectURL(file),
        cloudinaryUrl: null,
        deleteToken: null,
        isUploading: true,
        error: null,
      } satisfies UploadedPhoto;
    });
    setSubmitError(null);
    setPhotos((currentPhotos) => [...currentPhotos, ...nextPhotos].slice(0, 4));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    await Promise.all(
      selectedFiles.map(async (file, index) => {
        const photoEntry = nextPhotos[index];
        if (!photoEntry) {
          return;
        }

        try {
          const uploadedPhoto = await uploadPhotoToCloudinary(file);
          if (removedPhotoIdsRef.current.has(photoEntry.id)) {
            removedPhotoIdsRef.current.delete(photoEntry.id);
            if (uploadedPhoto.deleteToken) {
              await deletePhotoFromCloudinary(uploadedPhoto.deleteToken);
            }
            return;
          }

          setPhotos((currentPhotos) =>
            currentPhotos.map((photo) =>
              photo.id === photoEntry.id
                ? {
                    ...photo,
                    cloudinaryUrl: uploadedPhoto.cloudinaryUrl,
                    deleteToken: uploadedPhoto.deleteToken,
                    isUploading: false,
                    error: null,
                  }
                : photo,
            ),
          );
        } catch (error) {
          if (removedPhotoIdsRef.current.has(photoEntry.id)) {
            removedPhotoIdsRef.current.delete(photoEntry.id);
            return;
          }

          setPhotos((currentPhotos) =>
            currentPhotos.map((photo) =>
              photo.id === photoEntry.id
                ? {
                    ...photo,
                    isUploading: false,
                    error:
                      error instanceof Error
                        ? error.message
                        : 'Unable to upload this image right now.',
                  }
                : photo,
            ),
          );
        }
      }),
    );
  };

  const removePhoto = async (photoId: string) => {
    const targetPhoto = photos.find((photo) => photo.id === photoId);
    if (!targetPhoto) {
      return;
    }

    removedPhotoIdsRef.current.add(photoId);
    URL.revokeObjectURL(targetPhoto.previewUrl);
    setPhotos((currentPhotos) => currentPhotos.filter((photo) => photo.id !== photoId));

    if (!targetPhoto.deleteToken) {
      return;
    }

    try {
      await deletePhotoFromCloudinary(targetPhoto.deleteToken);
      removedPhotoIdsRef.current.delete(photoId);
    } catch {
      setSubmitError('Image removed locally, but Cloudinary cleanup failed.');
    }
  };

  const handleListAction = async () => {
    const normalizedItemName = itemName.trim();
    const normalizedCategory = selectedCategory.trim();
    const normalizedDescription = itemDescription.trim();
    const profilePostcode = user?.postcode?.trim() ?? '';
    const usingAddress = locationType === 'address';
    const resolvedShop = selectedShop ?? preselectedShop;
    const resolvedAddressLine = usingAddress
      ? pickupAddressLine.trim()
      : (resolvedShop?.address ?? '').trim();
    const resolvedPostcode = usingAddress
      ? profilePostcode
      : (resolvedShop?.postcode ?? '').trim();

    if (!normalizedItemName || !normalizedCategory || !selectedCondition) {
      setSubmitError('Please provide item name, category and condition before listing.');
      return;
    }

    if (usingAddress && !profilePostcode) {
      setSubmitError('Your profile postcode is required for My Address pickup.');
      return;
    }

    if (usingAddress && !resolvedAddressLine) {
      setSubmitError('Please provide your pickup address line.');
      return;
    }

    if (!usingAddress && !resolvedShop) {
      setSubmitError('Please search and select a partner shop.');
      return;
    }

    if (!resolvedAddressLine || !resolvedPostcode) {
      setSubmitError('Pickup location details are incomplete.');
      return;
    }

    if (photos.some((photo) => photo.isUploading)) {
      setSubmitError('Please wait for all image uploads to finish.');
      return;
    }

    if (photos.some((photo) => photo.error || !photo.cloudinaryUrl)) {
      setSubmitError('One or more images failed to upload. Remove failed images and try again.');
      return;
    }

    const uploadedImages = photos
      .map((photo) => photo.cloudinaryUrl)
      .filter((photoUrl): photoUrl is string => Boolean(photoUrl))
      .map((photoUrl) => ({
        url: photoUrl,
        altText: normalizedItemName,
      }));

    // Matches backend OpenAPI `CreateItemDto` field names and enums.
    const payload: CreateItemRequest = {
      title: normalizedItemName,
      description: normalizedDescription.length > 0 ? normalizedDescription : undefined,
      condition: selectedCondition as CreateItemRequest['condition'],
      category: normalizedCategory,
      images: uploadedImages.length > 0 ? uploadedImages : undefined,
      address_line: resolvedAddressLine,
      postcode: resolvedPostcode,
      pickup_option: usingAddress ? 'exchange' : 'donate',
      dropoff_location_id: usingAddress ? undefined : resolvedShop?.id,
      size_unit: 'm',
      size_length: 1,
      size_breadth: 1,
      size_height: 1,
      weight_kg: 1,
    };

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const response = await apiRequest<unknown, CreateItemRequest>('/items', {
        method: 'POST',
        body: payload,
      });
      const responseData = asRecord(unwrapApiData<unknown>(response));
      const qrCodeUrl = readString(responseData?.qr_code);

      setCreatedQrCodeUrl(qrCodeUrl);
      setCreatedPickupLocation({
        title: usingAddress ? 'My Address' : resolvedShop?.name ?? 'Partner Shop',
        address: `${resolvedAddressLine}${resolvedPostcode ? `, ${resolvedPostcode}` : ''}`,
      });
      setIsSuccess(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Unable to create listing right now. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveQrCode = async () => {
    if (!createdQrCodeUrl) {
      setQrDownloadError('QR code is not available yet.');
      return;
    }

    try {
      setQrDownloadError(null);
      const response = await fetch(createdQrCodeUrl);
      if (!response.ok) {
        throw new Error('Unable to download QR code right now.');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `trucycle-qr-${Date.now()}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      const fallbackLink = document.createElement('a');
      fallbackLink.href = createdQrCodeUrl;
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      fallbackLink.click();

      setQrDownloadError(
        error instanceof Error
          ? `${error.message} Opened QR code in a new tab instead.`
          : 'Opened QR code in a new tab because download was not available.',
      );
    }
  };

  if (isSuccess) {
    const pickupTitle = createdPickupLocation?.title ?? 'Pickup Location';
    const pickupAddress = createdPickupLocation?.address ?? 'Location unavailable';

    return (
      <Modal isOpen={isOpen} onClose={handleClose} hideCloseButton containerClassName="max-w-[520px]">
        <div className="relative flex flex-col gap-4 p-6">
          <button
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
            onClick={handleClose}
          >
            <X size={20} />
          </button>

          <div className="flex justify-center">
            <img src={successIcon} alt="Success" className="h-[100px] w-[100px]" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-[#121212]">Congratulations!</h2>
            <p className="mt-1 text-md text-[#12121299]">Your listing is live</p>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC80] p-5">
            <h4 className="text-md text-[#222222]">{itemName || 'Untitled item'}</h4>
            <p className="mt-2 text-md text-[#222222BF]">
              Category: <span className="font-medium text-[#222222]">{selectedCategory || 'Electronics'}</span>
            </p>
            <p className="text-md text-[#222222BF]">
              Condition: <span className="font-medium text-[#222222]">{selectedConditionLabel || 'Like New'}</span>
            </p>
          </div>

          <div className="rounded-xl p-4 text-center">
            <div className="mx-auto mb-2 flex h-72 w-72 items-center justify-center rounded-xl bg-white p-2">
              {createdQrCodeUrl ? (
                <img
                  src={createdQrCodeUrl}
                  alt="Listing QR code"
                  className="h-full w-full rounded object-contain"
                />
              ) : (
                <QrCode size={52} className="text-emerald-700" strokeWidth={1.5} />
              )}
            </div>
            <p className="text-sm text-[#222222BF]">
              Share this QR code with potential collectors or use it at handoff.
            </p>
            {createdQrCodeUrl ? null : (
              <p className="mt-2 text-sm text-orange-600">QR code was not returned for this listing.</p>
            )}
          </div>

          <div className="rounded-xl border border-[#A4F5A680] bg-[#A4F5A60D] p-5">
            <div className="flex items-start gap-2">
              <MapPin size={18} className="mt-0.5 text-[#A4F5A6]" />
              <div>
                <h4 className="text-sm font-semibold text-[#222222]">{pickupTitle}</h4>
                <p className="text-xs text-[#222222BF]">{pickupAddress}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#F9731680] bg-[#F973160D] p-5">
            <div className="flex items-start gap-2">
              <Clock size={18} className="mt-0.5 text-[#F97316]" />
              <div>
                <h4 className="text-sm font-semibold text-[#222222]">Expires in 71h</h4>
                <p className="text-xs text-[#222222BF]">Listing expires if not claimed within 3 days.</p>
              </div>
            </div>
          </div>

          {qrDownloadError ? <p className="text-xs text-rose-600">{qrDownloadError}</p> : null}

          <div className="flex justify-end gap-3 py-3">
            <Button variant="secondary" onClick={handleClose}>Done</Button>
            <Button variant="primary" onClick={() => { void handleSaveQrCode(); }} disabled={!createdQrCodeUrl}>
              Save QR Code
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} hideCloseButton containerClassName="max-w-[620px]">
      <div className="flex max-h-[90vh] flex-col">
        <header className="flex items-start justify-between border-b border-slate-100 px-6 pb-4 pt-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">List an Item</h2>
            <p className="text-sm text-slate-500">Share items you no longer need with your community</p>
          </div>
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
            onClick={handleClose}
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Photos</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              multiple
              accept="image/*"
              className="hidden"
            />
            <div className="flex flex-wrap gap-3">
              {photos.map((photo, index) => (
                <div key={photo.id} className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200">
                  <img src={photo.previewUrl} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
                  {photo.isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40">
                      <span className="text-[10px] font-semibold text-white">Uploading...</span>
                    </div>
                  ) : null}
                  {photo.error ? (
                    <div className="absolute inset-x-0 bottom-0 bg-rose-600/85 px-1 py-0.5 text-center text-[9px] font-semibold text-white">
                      Failed
                    </div>
                  ) : null}
                  <button
                    className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm"
                    onClick={() => {
                      void removePhoto(photo.id);
                    }}
                    title="Remove photo"
                    disabled={isSubmitting}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {photos.length < 4 ? (
                <button
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 text-slate-500 transition hover:border-lime-300 hover:text-slate-700"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <Upload size={20} />
                  <span className="text-[11px] font-medium">Add photo</span>
                </button>
              ) : null}
            </div>
            <p className="text-xs text-slate-400">You can upload up to 4 photos. First photo will be the cover image.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Item Name</label>
            <input
              type="text"
              className={inputClassName}
              placeholder="e.g., iPhone 12Pro - 128GB"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Category</label>
            <CustomSelect
              value={selectedCategory}
              options={CATEGORIES.map((category) => ({ value: category, label: category }))}
              placeholder="Select"
              onChange={setSelectedCategory}
              buttonClassName={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Condition</label>
            <CustomSelect
              value={selectedCondition}
              options={CONDITIONS.map((condition) => ({ value: condition.value, label: condition.label }))}
              placeholder="Select"
              onChange={setSelectedCondition}
              buttonClassName={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Description (optional)</label>
            <textarea
              className="min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
              placeholder="Describe the item's condition, accessories included, etc..."
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Pickup Location Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={classNames(
                  'flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold',
                  locationType === 'address'
                    ? 'border-lime-500 bg-lime-500 text-white'
                    : 'border-slate-200 bg-white text-slate-700',
                )}
                onClick={() => setLocationType('address')}
              >
                <span>My Address</span>
                <span className={classNames(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  locationType === 'address' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600',
                )}>
                  Exchange
                </span>
              </button>
              <button
                className={classNames(
                  'flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold',
                  locationType === 'shop'
                    ? 'border-lime-500 bg-lime-500 text-white'
                    : 'border-slate-200 bg-white text-slate-700',
                )}
                onClick={() => setLocationType('shop')}
              >
                <span>Partner Shop</span>
                <span className={classNames(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  locationType === 'shop' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600',
                )}>
                  Donor
                </span>
              </button>
            </div>
          </div>

          {locationType === 'address' ? (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="text-sm font-semibold text-slate-700">Pickup Address Line</label>
              <input
                type="text"
                className={inputClassName}
                placeholder="e.g., 50 Abbey Road"
                value={pickupAddressLine}
                onChange={(event) => setPickupAddressLine(event.target.value)}
              />
              <label className="text-sm font-semibold text-slate-700">Profile Postcode (sent to backend)</label>
              <input
                type="text"
                readOnly
                className={classNames(inputClassName, 'bg-slate-100 text-slate-600')}
                value={user?.postcode ?? ''}
                placeholder="No postcode on profile"
              />
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  readOnly
                  value={selectedShop ? `${selectedShop.name} (${selectedShop.postcode})` : ''}
                  className={classNames(inputClassName, 'pl-10')}
                  placeholder="Search and select a shop"
                />
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
                <div className="relative">
                  <input
                    type="text"
                    value={shopSearchQuery}
                    onChange={(event) => setShopSearchQuery(event.target.value)}
                    className={classNames(inputClassName)}
                    placeholder="Search by name or postcode"
                  />
                </div>

                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {isLoadingShops ? (
                    <p className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500">
                      Loading nearby partner shops...
                    </p>
                  ) : null}
                  {!isLoadingShops && shopsError ? (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                      {shopsError}
                    </p>
                  ) : null}
                  {!isLoadingShops && !shopsError && filteredShops.length === 0 ? (
                    <p className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500">
                      No shops found matching your search.
                    </p>
                  ) : null}
                  {!isLoadingShops && !shopsError
                    ? filteredShops.map((shop) => {
                      const isSelected = selectedShopId === shop.id;
                      return (
                        <button
                          key={shop.id}
                          type="button"
                          className={classNames(
                            'w-full rounded-xl border px-3 py-3 text-left transition',
                            isSelected
                              ? 'border-lime-400 bg-lime-50'
                              : 'border-slate-200 bg-white hover:border-slate-300',
                          )}
                          onClick={() => setSelectedShopId(shop.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{shop.name}</p>
                              <p className="text-xs text-slate-600">{shop.address}</p>
                            </div>
                            <span className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700">
                              {shop.postcode}
                            </span>
                          </div>
                        </button>
                      );
                    })
                    : null}
                </div>
              </div>
            </div>
          )}

          {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : null}

          <div className="rounded-xl border border-lime-200 bg-lime-50 p-4">
            <h3 className="text-sm font-bold text-slate-900">Environmental Impact</h3>
            <p className="mt-1 text-sm text-slate-600">
              By listing this item, you're helping reduce electronic waste and saving approximately{' '}
              <span className="font-extrabold text-lime-700">12kg of CO2</span> from entering the atmosphere.
            </p>
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-100 px-6 pb-6 pt-4">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={() => { void handleListAction(); }} disabled={isSubmitting || hasUploadingPhotos}>
            <Plus size={18} />
            {isSubmitting ? 'Listing...' : hasUploadingPhotos ? 'Uploading images...' : 'List Item'}
          </Button>
        </footer>
      </div>
    </Modal>
  );
};
