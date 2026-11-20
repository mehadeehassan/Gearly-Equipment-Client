export type UserRole = 'customer' | 'owner' | 'admin';
export type RentalType = 'Daily' | 'Weekly' | 'Monthly';
export type EquipmentStatus = 'pending' | 'approved' | 'rejected';
export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  image?: string;
  createdAt?: string;
  role?: UserRole;
  phone?: string;
  address?: string;
}
export interface Equipment {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  price: number;
  rentalType: RentalType;
  availableQuantity: number;
  condition?: string;
  brand?: string;
  model?: string;
  image: string;
  terms?: string;
  ownerName?: string;
  status?: EquipmentStatus;
  createdAt?: string;
}
export interface Booking {
  _id: string;
  equipmentId: string;
  equipmentTitle: string;
  equipmentImage?: string;
  customerName?: string;
  customerEmail?: string;
  ownerName?: string;
  ownerEmail?: string;
  startDate: string;
  endDate: string;
  bookingDate: string;
  duration: number;
  quantity: number;
  totalAmount: number;
  paymentStatus: string;
  transactionId?: string;
  stripePaymentIntentId?: string;
  bookingStatus: string;
  reviewed?: boolean;
  contactNumber?: string;
  deliveryAddress?: string;
}
export interface ApiList<T> {
  [key: string]: T[] | number;
}
export interface PaginationInfo {
  currentPage: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
export interface EquipmentResponse {
  equipment: Equipment[];
  total: number;
  page: number;
  totalPages: number;
}
export interface Analytics {
  totalUsers?: number;
  totalEquipment?: number;
  totalBookings?: number;
  pendingApprovals?: number;
  completedRentals?: number;
  totalRevenue?: number;
  totalReviews?: number;
  homepageReviews?: number;
  myEquipmentReviews?: number;
  totalEarnings?: number;
  approvedEquipment?: number;
  pendingEquipment?: number;
  activeRentals?: number;
  pendingBookings?: number;
  totalSpending?: number;
  monthlyBookings?: { _id: string; total: number }[];
  monthlyEarnings?: { _id: string; total: number }[];
  monthlyRevenue?: { _id: string; total: number }[];
  monthlyRentals?: { _id: string; total: number }[];
  recentBookings?: Booking[];
  recentBookingsPagination?: PaginationInfo;
}

export interface Review {
  _id: string;
  customerName?: string;
  customerImage?: string;
  equipmentTitle?: string;
  rating: number;
  comment: string;
  createdAt?: string;
}
