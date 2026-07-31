import { ChevronLeft, Heart, Hotel as HotelIcon, MapPin, Star } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { amenityMeta, hotels, type Room } from '@/modules/accommodation/data';
import { ROUTES } from '@/lib/routes';

// Hotel detail — reached from AccommodationSearchPage. UI only, matching
// a user-supplied Figma screenshot ("Hotel details") for Labadi Beach
// Hotel specifically; see data.ts for which hotels have full detail
// content vs. an honest empty state.
function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-4 ${
            i < count ? 'fill-accent-500 text-accent-500' : 'text-neutral-200 dark:text-neutral-700'
          }`}
        />
      ))}
    </div>
  );
}

export function AccommodationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const hotel = hotels.find((h) => h.slug === slug);
  const [favorite, setFavorite] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(hotel?.rooms?.[0] ?? null);

  if (!hotel) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Couldn't find this hotel.</p>
        <Link to={ROUTES.hotels} className="text-sm font-medium text-brand-600 dark:text-brand-500">
          Back to search
        </Link>
      </div>
    );
  }

  const displayPrice = selectedRoom?.pricePerNight ?? hotel.pricePerNight;

  return (
    <div className="pb-24 md:mx-auto md:max-w-2xl md:pb-0">
      <div className="relative flex h-72 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 dark:from-neutral-800 dark:to-neutral-950 md:mt-6 md:h-80 md:rounded-card">
        <HotelIcon className="size-12" />
        <Link
          to={ROUTES.hotels}
          className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <button
          type="button"
          onClick={() => setFavorite((f) => !f)}
          aria-label="Save hotel"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow"
        >
          <Heart className={`size-5 ${favorite ? 'fill-danger-500 text-danger-500' : ''}`} />
        </button>
      </div>

      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">{hotel.name}</h1>
          <span className="flex shrink-0 items-center gap-1 text-base font-semibold text-ink-900 dark:text-white">
            <Star className="size-5 fill-accent-500 text-accent-500" /> {hotel.rating}
          </span>
        </div>
        <div className="mt-1">
          <StarRow count={hotel.stars} />
        </div>
        <p className="mt-2 flex items-center gap-1 text-sm text-brand-600 dark:text-brand-500">
          <MapPin className="size-4" /> {hotel.location}
        </p>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {hotel.amenities.map((key) => {
            const { icon: Icon, long } = amenityMeta[key];
            return (
              <div key={key} className="flex flex-col items-center gap-2 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-500">
                  <Icon className="size-6" />
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{long}</span>
              </div>
            );
          })}
        </div>

        <h2 className="mb-3 mt-6 text-lg font-bold text-ink-900 dark:text-white">Choose a Room</h2>
        {!hotel.rooms || hotel.rooms.length === 0 ? (
          <p className="text-sm text-neutral-400">No room information available yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {hotel.rooms.map((room) => {
              const isSelected = selectedRoom?.name === room.name;
              return (
                <button
                  key={room.name}
                  type="button"
                  onClick={() => setSelectedRoom(room)}
                  className={`rounded-card border p-4 text-left transition ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-700/20'
                      : 'border-neutral-100 dark:border-neutral-800'
                  }`}
                >
                  <div className="font-semibold text-ink-900 dark:text-white">{room.name}</div>
                  <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    {room.guests} Guests
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">{room.bed}</div>
                  <div className="mt-3 text-base font-bold text-brand-600 dark:text-brand-500">
                    {room.pricePerNight}
                    <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
                      /night
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <h2 className="mb-3 mt-6 text-lg font-bold text-ink-900 dark:text-white">Guest Reviews</h2>
        {!hotel.reviews || hotel.reviews.length === 0 ? (
          <p className="text-sm text-neutral-400">No reviews yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {hotel.reviews.map((review) => (
              <div
                key={review.name}
                className="rounded-card border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink-900 dark:text-white">{review.name}</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-ink-900 dark:text-white">
                    <Star className="size-4 fill-accent-500 text-accent-500" /> {review.rating.toFixed(1)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{review.comment}</p>
                <p className="mt-2 text-xs text-neutral-400">{review.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[72px] mx-auto flex max-w-md items-center justify-between border-t border-neutral-100 bg-white py-3 pl-5 pr-20 dark:border-neutral-800 dark:bg-neutral-950 md:pr-8 md:sticky md:inset-x-auto md:bottom-0 md:max-w-none md:rounded-t-card md:border md:border-b-0 md:shadow-[0_-6px_20px_rgba(20,33,61,0.08)]">
        <div>
          <span className="text-lg font-bold text-brand-600 dark:text-brand-500">
            {displayPrice}
          </span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400"> / night</span>
        </div>
        <button
          type="button"
          className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Reserve Now
        </button>
      </div>
    </div>
  );
}
