import {
  Eye, Users, Handshake, Rocket, Phone, BookOpen, Code,
  Crosshair, Crown, BarChart3, Zap, Cpu, Layers,
  Hammer, MessageCircle, Mail, Calendar, GraduationCap,
  ArrowRight,
  // The /about values table names these; they fell through to Zap, so five
  // of six values showed the same lightning bolt.
  Target, TrendingUp, Minimize2, Shield, Palette,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Eye, Users, Handshake, Rocket, Phone, BookOpen, Code,
  Crosshair, Crown, BarChart3, Zap, Cpu, Layers,
  Hammer, MessageCircle, Mail, Calendar, GraduationCap,
  ArrowRight,
  Target, TrendingUp, Minimize2, Shield, Palette,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || Zap;
}
