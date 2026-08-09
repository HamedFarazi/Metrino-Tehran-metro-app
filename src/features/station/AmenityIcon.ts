/**
 * Amenity Icon Configuration
 */
import type { LucideIcon } from "lucide-react";
import {
  CreditCard, Users, Coffee, Utensils, ShoppingCart,
  ArrowUpDown, Accessibility, Bike, Wifi, BookOpen,
  ShieldCheck, Camera, Armchair, Ticket, Droplets,
  Trash2, Siren, Flame, Wind, PawPrint,
} from "lucide-react";
import type { AmenityKey } from "@/types/metro";

export type AmenityInfo = {
  icon: LucideIcon;
  labelFa: string;
  color: string;
  bg: string;
};

export const AmenityIcon: Partial<Record<AmenityKey, AmenityInfo>> = {
  atm:                  { icon: CreditCard,   labelFa: "خودپرداز",          color: "text-emerald-400", bg: "bg-emerald-500/10" },
  restroom:             { icon: Users,         labelFa: "سرویس بهداشتی",    color: "text-blue-400",    bg: "bg-blue-500/10" },
  coffeeShop:           { icon: Coffee,        labelFa: "کافه",              color: "text-amber-400",   bg: "bg-amber-500/10" },
  fastFood:             { icon: Utensils,      labelFa: "فست‌فود",           color: "text-orange-400",  bg: "bg-orange-500/10" },
  cleanFood:            { icon: Flame,         labelFa: "غذای سالم",         color: "text-green-400",   bg: "bg-green-500/10" },
  groceryStore:         { icon: ShoppingCart,  labelFa: "فروشگاه",           color: "text-purple-400",  bg: "bg-purple-500/10" },
  elevator:             { icon: ArrowUpDown,   labelFa: "آسانسور",           color: "text-cyan-400",    bg: "bg-cyan-500/10" },
  blindPath:            { icon: Accessibility, labelFa: "مسیر نابینایان",    color: "text-indigo-400",  bg: "bg-indigo-500/10" },
  bicycleParking:       { icon: Bike,          labelFa: "پارکینگ دوچرخه",   color: "text-lime-400",    bg: "bg-lime-500/10" },
  freeWifi:             { icon: Wifi,          labelFa: "وای‌فای رایگان",    color: "text-sky-400",     bg: "bg-sky-500/10" },
  prayerRoom:           { icon: BookOpen,      labelFa: "نمازخانه",          color: "text-teal-400",    bg: "bg-teal-500/10" },
  metroPolice:          { icon: ShieldCheck,   labelFa: "پلیس مترو",         color: "text-red-400",     bg: "bg-red-500/10" },
  camera:               { icon: Camera,        labelFa: "دوربین مداربسته",   color: "text-slate-400",   bg: "bg-slate-500/10" },
  waitingChair:         { icon: Armchair,      labelFa: "صندلی انتظار",      color: "text-rose-400",    bg: "bg-rose-500/10" },
  creditTicketSales:    { icon: Ticket,        labelFa: "فروش بلیت اعتباری", color: "text-violet-400",  bg: "bg-violet-500/10" },
  waterCooler:          { icon: Droplets,      labelFa: "آبسردکن",           color: "text-blue-300",    bg: "bg-blue-400/10" },
  trashCan:             { icon: Trash2,        labelFa: "سطل زباله",          color: "text-zinc-400",    bg: "bg-zinc-500/10" },
  fireSuppressionSystem:{ icon: Siren,         labelFa: "سیستم اطفاء حریق",  color: "text-red-300",     bg: "bg-red-400/10" },
  fireExtinguisher:     { icon: Flame,         labelFa: "کپسول آتش‌نشانی",   color: "text-orange-300",  bg: "bg-orange-400/10" },
  smokingArea:          { icon: Wind,          labelFa: "منطقه سیگار",       color: "text-gray-400",    bg: "bg-gray-500/10" },
  petsAllowed:          { icon: PawPrint,      labelFa: "ورود حیوانات",      color: "text-yellow-400",  bg: "bg-yellow-500/10" },
};