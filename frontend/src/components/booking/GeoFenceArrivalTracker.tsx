import React, { useState } from 'react';
import { MapPin, Navigation, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateHaversineDistance } from '@/lib/bookingEngine';

export interface GeoFenceArrivalTrackerProps {
  jobLatitude?: number | null;
  jobLongitude?: number | null;
  arrivalRadiusMeters?: number;
  isVerified?: boolean;
  onVerifyArrival: (coords: { latitude: number; longitude: number; accuracy: number }) => Promise<void>;
  isWorker?: boolean;
  className?: string;
}

export const GeoFenceArrivalTracker: React.FC<GeoFenceArrivalTrackerProps> = ({
  jobLatitude,
  jobLongitude,
  arrivalRadiusMeters = 300,
  isVerified = false,
  onVerifyArrival,
  isWorker = true,
  className,
}) => {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [manualFallbackAllowed, setManualFallbackAllowed] = useState(false);

  const requestGpsAndVerify = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setManualFallbackAllowed(true);
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsAccuracy(Math.round(accuracy));

        // If job coordinates are available, calculate distance
        if (jobLatitude != null && jobLongitude != null) {
          const dist = calculateHaversineDistance(jobLatitude, jobLongitude, latitude, longitude);
          setCurrentDistance(dist);

          if (dist > arrivalRadiusMeters) {
            setGpsError(`You are ${dist}m away. Please proceed closer to the job site (within ${arrivalRadiusMeters}m).`);
            setGpsLoading(false);
            return;
          }
        }

        try {
          await onVerifyArrival({ latitude, longitude, accuracy });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Server verification failed';
          setGpsError(message);
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        setGpsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Please allow location access in your browser settings.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsError('GPS signal unavailable. You can use manual site arrival fallback.');
        } else {
          setGpsError('Location request timed out. Please try again.');
        }
        setManualFallbackAllowed(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10000,
      }
    );
  };

  const handleManualFallback = async () => {
    setGpsLoading(true);
    try {
      await onVerifyArrival({ latitude: 0, longitude: 0, accuracy: 999 });
    } catch {
      setGpsError('Failed to confirm manual arrival.');
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'p-4 rounded-2xl border transition-colors',
        isVerified
          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800',
        className
      )}
      role="region"
      aria-label="Geo-fenced Arrival Verification"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'p-2.5 rounded-xl shrink-0',
              isVerified
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
            )}
          >
            {isVerified ? (
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Navigation className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {isVerified ? 'Geo-Fence Arrival Confirmed' : 'Geo-Fenced Arrival Verification'}
              </h4>
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full',
                  isVerified
                    ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
                    : 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
                )}
              >
                {arrivalRadiusMeters}m Zone
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isVerified
                ? 'Worker arrived at customer job location within authorized geofence radius.'
                : 'Task timer activates only after verified physical arrival at client coordinates.'}
            </p>
          </div>
        </div>

        {/* Verification Trigger Button for Worker */}
        {isWorker && !isVerified && (
          <button
            type="button"
            onClick={requestGpsAndVerify}
            disabled={gpsLoading}
            className="unnati-touch-target shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 transition-all shadow-xs"
          >
            {gpsLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Checking GPS...</span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5" />
                <span>Verify My Arrival</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Distance and Accuracy Details */}
      {currentDistance != null && !isVerified && (
        <div className="mt-3 p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs flex items-center justify-between text-zinc-700 dark:text-zinc-300">
          <span>Distance from site: <strong>{currentDistance} meters</strong></span>
          {gpsAccuracy != null && <span>GPS Accuracy: ±{gpsAccuracy}m</span>}
        </div>
      )}

      {/* Error & Fallback */}
      {gpsError && !isVerified && (
        <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{gpsError}</span>
          </div>
          {manualFallbackAllowed && (
            <div className="pt-2 border-t border-amber-200 dark:border-amber-900 flex justify-end">
              <button
                type="button"
                onClick={handleManualFallback}
                className="text-xs font-bold underline text-amber-900 dark:text-amber-100 hover:text-amber-700"
              >
                Confirm Arrival with Site Manager Fallback (ऑफ़लाइन आगमन)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GeoFenceArrivalTracker;
