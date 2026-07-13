/**
 * Ícone por categoria de despesa — usado no seletor do formulário e na lista.
 * Categorias são slugs ASCII (ADR-008); labels pt-BR em shared/labels.
 */
import type { ComponentType, SVGProps } from 'react';
import { Icon } from '@/components/icons';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export const CATEGORY_ICONS: Record<string, IconType> = {
  moradia: Icon.Home,
  mercado: Icon.Cart,
  contasFixas: Icon.Receipt,
  transporte: Icon.Car,
  lazer: Icon.Sun,
  saude: Icon.Heart,
  pets: Icon.Paw,
  outro: Icon.Wallet,
};

export function categoryIcon(category: string): IconType {
  return CATEGORY_ICONS[category] ?? Icon.Wallet;
}
