import type { LucideIcon, LucideProps } from "lucide-react";
import {
  Apple,
  Armchair,
  Bed,
  Bike,
  Brain,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  Flame,
  Footprints,
  Hand,
  Handshake,
  Heart,
  Leaf,
  LogOut,
  Moon,
  PartyPopper,
  PersonStanding,
  Salad,
  Smile,
  Sparkles,
  StretchHorizontal,
  Sun,
  Sunrise,
  Target,
  Utensils,
  Zap,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type AppIconName =
  | "nutrition"
  | "fitness"
  | "habits"
  | "brain"
  | "clipboard"
  | "sparkles"
  | "flame"
  | "zap"
  | "bolt"
  | "party"
  | "sunrise"
  | "sun"
  | "salad"
  | "apple"
  | "moon"
  | "utensils"
  | "strength"
  | "walk"
  | "stretch"
  | "bike"
  | "sleep"
  | "target"
  | "handshake"
  | "leaf"
  | "lotus"
  | "wave"
  | "logout"
  | "chart"
  | "bars"
  | "armchair"
  | "sneakers"
  | "run"
  | "heart"
  | "dumbbell"
  | "arrowRight"
  | "arrowLeft"
  | "smile"
  | "user"
  | "mail"
  | "lock"
  | "eye"
  | "eyeOff";

const ICONS: Record<AppIconName, LucideIcon> = {
  nutrition: Salad,
  fitness: Dumbbell,
  habits: CheckCircle2,
  brain: Brain,
  clipboard: ClipboardList,
  sparkles: Sparkles,
  flame: Flame,
  zap: Zap,
  bolt: Zap,
  party: PartyPopper,
  sunrise: Sunrise,
  sun: Sun,
  salad: Salad,
  apple: Apple,
  moon: Moon,
  utensils: Utensils,
  strength: Dumbbell,
  walk: Footprints,
  stretch: StretchHorizontal,
  bike: Bike,
  sleep: Bed,
  target: Target,
  handshake: Handshake,
  leaf: Leaf,
  lotus: Leaf,
  wave: Hand,
  logout: LogOut,
  chart: BarChart3,
  bars: BarChart3,
  armchair: Armchair,
  sneakers: Footprints,
  run: PersonStanding,
  heart: Heart,
  dumbbell: Dumbbell,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  smile: Smile,
  user: User,
  mail: Mail,
  lock: Lock,
  eye: Eye,
  eyeOff: EyeOff,
};

export function AppIcon({
  name,
  className,
  size = 20,
  strokeWidth = 1.75,
  ...props
}: {
  name: AppIconName;
  className?: string;
  size?: number;
  strokeWidth?: number;
} & Omit<LucideProps, "ref" | "size" | "strokeWidth">) {
  const Icon = ICONS[name];
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

/** Meal slot icons cycling through the nutrition day. */
export const MEAL_ICONS: AppIconName[] = ["sunrise", "sun", "salad", "apple", "moon", "moon"];

/** Weekly fitness day icons. */
export const FITNESS_DAY_ICONS: AppIconName[] = [
  "strength",
  "walk",
  "fitness",
  "stretch",
  "zap",
  "bike",
  "sleep",
];
