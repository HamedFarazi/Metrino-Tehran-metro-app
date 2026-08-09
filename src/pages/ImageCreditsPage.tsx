/**
 * ImageCreditsPage
 * 
 * Displays attribution and licensing information for all station images
 * sourced from Wikimedia Commons.
 */

import { useState } from 'react';
import { ArrowLeft, ExternalLink, Image as ImageIcon, Filter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { stationImagesService } from '@/services/station-images.service';
import { cn } from '@/lib/utils';

export function ImageCreditsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLicense, setSelectedLicense] = useState<string>('all');

  // Get all images and statistics
  const allImages = stationImagesService.getAllImages();
  const imagesByLicense = stationImagesService.getImagesByLicense();
  const stats = stationImagesService.getStats();

  // Get unique licenses
  const licenses = Object.keys(imagesByLicense).sort();

  // Filter images based on search and license
  const filteredImages = allImages.filter(image => {
    const matchesSearch = 
      searchTerm === '' ||
      image.metadata.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.metadata.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.metadata.license.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLicense = 
      selectedLicense === 'all' || 
      image.metadata.license === selectedLicense;
    
    return matchesSearch && matchesLicense;
  });

  if (allImages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-gray-900/30 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/15 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">اعتبار تصاویر</h1>
              <p className="text-sm text-white/40 mt-1">Image Credits</p>
            </div>
          </div>

          {/* Empty state */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-white/40" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2" dir="rtl">
              هنوز تصویری اضافه نشده است
            </h3>
            <p className="text-white/60 mb-4" dir="rtl">
              برای اضافه کردن تصاویر ایستگاه‌ها، اسکریپت ویکی‌مدیا را اجرا کنید.
            </p>
            <div className="text-xs text-white/40 space-y-1">
              <p>Run the image fetch script to add station photos:</p>
              <code className="bg-black/30 px-2 py-1 rounded">npm run images:fetch</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-gray-900/30 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/15 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">اعتبار تصاویر</h1>
              <p className="text-sm text-white/40 mt-1">Image Credits & Licensing</p>
            </div>
          </div>
          
          {/* Stats badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-300">
              {stats.stationsWithImages} ایستگاه با تصویر
            </span>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <p className="text-xs text-white/40 mb-1">Total Images</p>
            <p className="text-2xl font-bold text-white">{stats.totalImages}</p>
          </div>
          <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <p className="text-xs text-white/40 mb-1">Stations Covered</p>
            <p className="text-2xl font-bold text-white">{stats.stationsWithImages}/{stats.totalStations}</p>
          </div>
          <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <p className="text-xs text-white/40 mb-1">Coverage</p>
            <p className="text-2xl font-bold text-white">{stats.coverage.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <p className="text-xs text-white/40 mb-1">Unique Licenses</p>
            <p className="text-2xl font-bold text-white">{licenses.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="جستجو در عکاسان، توضیحات، مجوزها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/20 transition-colors"
                dir="rtl"
              />
            </div>
          </div>
          
          {/* License filter */}
          <div className="w-full md:w-48">
            <div className="relative">
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/30" />
              <select
                value={selectedLicense}
                onChange={(e) => setSelectedLicense(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white text-sm focus:outline-none focus:border-white/20 transition-colors appearance-none"
              >
                <option value="all">همه مجوزها</option>
                {licenses.map(license => (
                  <option key={license} value={license}>{license}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* License summary */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4" dir="rtl">مجوزهای استفاده شده</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {licenses.map(license => {
              const count = imagesByLicense[license].length;
              return (
                <div
                  key={license}
                  className={cn(
                    "rounded-xl border p-4 cursor-pointer transition-all hover:scale-[1.02]",
                    selectedLicense === license 
                      ? "bg-white/10 border-white/20" 
                      : "bg-white/5 border-white/10"
                  )}
                  onClick={() => setSelectedLicense(license === selectedLicense ? 'all' : license)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{license}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
                      {count} تصویر
                    </span>
                  </div>
                  <div className="text-xs text-white/50 line-clamp-2">
                    {getLicenseDescription(license)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Image list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white" dir="rtl">
              همه تصاویر ({filteredImages.length})
            </h2>
            <p className="text-sm text-white/40">
              {filteredImages.length === allImages.length ? 'All images' : 'Filtered images'}
            </p>
          </div>

          <div className="space-y-4">
            {filteredImages.map((image, index) => (
              <div
                key={`${image.stationId}-${index}`}
                className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden"
              >
                <div className="md:flex">
                  {/* Image preview */}
                  <div className="md:w-48 h-48 md:h-auto relative">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white">
                        {image.metadata.license}
                      </div>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 p-4" dir="rtl">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          ایستگاه {image.stationId.replace('station_', '')}
                        </h3>
                        <p className="text-sm text-white/60">{image.alt}</p>
                      </div>
                      <a
                        href={image.metadata.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm transition-colors"
                      >
                        <span>مشاهده منبع</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-white/40 mb-1">عکاس / آپلودکننده</p>
                        <p className="text-sm text-white/80">{image.metadata.author || 'Unknown'}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-white/40 mb-1">مجوز</p>
                        <a
                          href={image.metadata.licenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-emerald-300 hover:text-emerald-200 transition-colors"
                        >
                          {image.metadata.license}
                        </a>
                      </div>
                      
                      <div className="md:col-span-2">
                        <p className="text-xs text-white/40 mb-1">توضیحات</p>
                        <p className="text-sm text-white/70">
                          {image.metadata.description || 'No description available'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-white/40 mb-1">ابعاد اصلی</p>
                        <p className="text-sm text-white/80">
                          {image.metadata.width} × {image.metadata.height} پیکسل
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-white/40 mb-1">تاریخ آپلود</p>
                        <p className="text-sm text-white/80">
                          {new Date(image.metadata.timestamp).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    </div>
                    
                    {image.metadata.attribution && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <p className="text-xs text-white/40 mb-1">شرایط احراز</p>
                        <p className="text-xs text-white/60">{image.metadata.attribution}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-sm text-white/50 mb-2" dir="rtl">
            تمامی تصاویر از ویکی‌مدیا کامنز گرفته شده و طبق قوانین مجوز مربوطه قابل استفاده هستند.
          </p>
          <p className="text-xs text-white/30">
            All images sourced from Wikimedia Commons and used under their respective licenses.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Get description for common licenses
 */
function getLicenseDescription(license: string): string {
  const descriptions: Record<string, string> = {
    'CC BY-SA 4.0': 'Creative Commons Attribution-ShareAlike 4.0 International',
    'CC BY-SA 3.0': 'Creative Commons Attribution-ShareAlike 3.0 Unported',
    'CC BY 4.0': 'Creative Commons Attribution 4.0 International',
    'CC BY 3.0': 'Creative Commons Attribution 3.0 Unported',
    'CC0': 'Public Domain Dedication',
    'Public Domain': 'No copyright restrictions',
    'GFDL': 'GNU Free Documentation License',
  };
  
  return descriptions[license] || 'Creative Commons license';
}