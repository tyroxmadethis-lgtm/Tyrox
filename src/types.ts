/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Track {
  id: string;
  title: string;
  producer: string;
  bpm: number;
  key: string;
  duration: string; // e.g., "3:14"
  tags: string[];
  imageUrl: string;
  audioUrl?: string; // Optional URL, or we synthesize it
  price?: number;    // Single flat price
  prices: {
    mp3: number;
    wav: number;
    unlimited: number;
    exclusive: number;
  };
  plays: number;
  downloads: number;
  sales: number;
  createdAt: string;
  isHot?: boolean;
  allowFreeDownload?: boolean;
  streams?: number;
  plaque_awarded?: boolean;
  peaks?: number[];
}

export interface LicenseOption {
  id: 'mp3' | 'wav' | 'unlimited' | 'exclusive';
  name: string;
  price: number;
  format: string;
  terms: string[];
  description: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  active: boolean;
}

export interface CartItem {
  track: Track;
  license: LicenseOption;
}

export interface SaleActivity {
  id: string;
  trackTitle: string;
  price: number;
  licenseType: string;
  buyerEmail: string;
  timestamp: string;
  status: 'completed' | 'processing' | 'refunded';
}

export interface LicensingContract {
  id: string;
  title: string;
  price: number;
  distributorLimit: string;
  monetizationAllowed: boolean;
  termsText: string;
}
