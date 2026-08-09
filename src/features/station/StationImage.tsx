/**
 * StationImage Component
 * 
 * Displays station images from Wikimedia Commons with proper attribution
 * and fallback design for stations without images.
 */

import { useState } from 'react';
import { Image, Info } from 'lucide-react';
import type { Station } from '@/types/metro';
import type { StationImage as StationImageType } from '@/types/station-images';
import { LineBadge } from '@/components/shared/LineBadge';
import { cn } from '@/lib/utils';

interface StationImageProps {
  station: Station;
  stationImage?: StationImageType;
  className?: string;
  showAttribution?: boolean;
  priority?: boolean;
}

export function StationImage({
  station,
  stationImage,
  className = '',
  showAttribution = true,
  priority = false
}: StationImageProps) {
  const [isAttributionVisible, setIsAttributionVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  // If no image or image failed to load, show fallback
  const showFallback = !stationImage || imageError;

  if (showFallback) {
    return (
      <div className={cn(
        "relative w-full aspect-video rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-gray-900/90 to-gray-800/90",
        "flex flex-col items-center justify-center p-6",
        "border border-white/10 shadow-2xl",
        className
      )}>
        {/* Station icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4">
          <Image className="w-8 h-8 text-white/60" />
        </div>
        
        {/* Station name */}
        <h3 className="text-xl font-bold text-white text-center mb-2" dir="rtl">
          {station.nameFa}
        </h3>
        
        {/* Line badges */}
        <div className="flex gap-2 mb-3">
          {station.lines.map(lineId => (
            <LineBadge key={lineId} lineId={lineId} size="sm" showLabel />
          ))}
        </div>
        
        {/* Fallback message */}
        <p className="text-sm text-white/50 text-center" dir="rtl">
          تصویر ایستگاه در دسترس نیست
        </p>
        <p className="text-xs text-white/30 text-center mt-1">
          Station photo unavailable
        </p>
      </div>
    );
  }

  // Show actual image with attribution
  return (
    <div className={cn(
      "relative w-full aspect-video rounded-2xl overflow-hidden",
      "group cursor-pointer",
      className
    )}>
      {/* Image */}
      <img
        src={stationImage.src}
        alt={stationImage.alt}
        loading={priority ? 'eager' : 'lazy'}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={() => setImageError(true)}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      
      {/* Station info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              {station.nameFa}
            </h3>
            <div className="flex gap-2">
              {station.lines.map(lineId => (
                <LineBadge key={lineId} lineId={lineId} size="xs" />
              ))}
            </div>
          </div>
          
          {/* Attribution toggle */}
          {showAttribution && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAttributionVisible(!isAttributionVisible);
              }}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white/60 hover:text-white transition-colors"
              aria-label="Show image attribution"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Attribution panel */}
      {showAttribution && isAttributionVisible && (
        <div className="absolute top-4 left-4 right-4 bg-black/80 backdrop-blur-lg rounded-xl p-4 border border-white/10 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-sm font-semibold text-white" dir="rtl">
              اطلاعات تصویر
            </h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAttributionVisible(false);
              }}
              className="text-white/40 hover:text-white transition-colors"
              aria-label="Close attribution"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2 text-xs" dir="rtl">
            <div className="flex justify-between">
              <span className="text-white/60">منبع:</span>
              <a
                href={stationImage.metadata.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 underline"
              >
                ویکی‌مدیا کامنز
              </a>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/60">عکاس:</span>
              <span className="text-white/80">{stationImage.metadata.author}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/60">مجوز:</span>
              <a
                href={stationImage.metadata.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-300 hover:text-green-200"
              >
                {stationImage.metadata.license}
              </a>
            </div>
            
            {stationImage.metadata.description && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-white/70 text-[11px] leading-relaxed">
                  {stationImage.metadata.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Wikimedia Commons badge */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/10">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-[10px] font-medium text-white/80">ویکی‌مدیا</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Station Image Header for use in station sheets
 */
interface StationImageHeaderProps {
  station: Station;
  stationImage?: StationImageType;
}

export function StationImageHeader({ station, stationImage }: StationImageHeaderProps) {
  return (
    <div className="relative">
      <StationImage
        station={station}
        stationImage={stationImage}
        className="rounded-t-2xl rounded-b-none"
        showAttribution={false}
        priority={true}
      />
      
      {/* Additional station info overlay */}
      {stationImage && (
        <div className="absolute top-4 left-4">
          <div className="bg-black/50 backdrop-blur-lg rounded-lg px-2 py-1">
            <span className="text-xs text-white/80 font-medium">📸</span>
          </div>
        </div>
      )}
    </div>
  );
}