import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Coupon {
  _id?: string;
  couponNumber: string;
  prizeName: string;
  prizeNumber: string;
  customerName: string;
  agentName: string;
  createdAt?: string;
  createdBy?: any;
}

export interface CouponResponse {
  success: boolean;
  coupon?: Coupon;
  coupons?: Coupon[];
  count?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private apiUrl = `${environment.apiUrl}/coupons`;

  constructor(private http: HttpClient) {}

  /** GET /api/coupons/public — No auth required */
  getPublicCoupons(): Observable<CouponResponse> {
    return this.http.get<CouponResponse>(`${this.apiUrl}/public`);
  }

  /** GET /api/coupons — Auth required */
  getAllCoupons(): Observable<CouponResponse> {
    return this.http.get<CouponResponse>(this.apiUrl);
  }

  /** POST /api/coupons — Auth required */
  createCoupon(payload: {
    couponNumber: string;
    prizeName: string;
    prizeNumber: string;
    customerName: string;
    agentName: string;
  }): Observable<CouponResponse> {
    return this.http.post<CouponResponse>(this.apiUrl, payload);
  }

  /** DELETE /api/coupons/:id — Auth required */
  deleteCoupon(id: string): Observable<CouponResponse> {
    return this.http.delete<CouponResponse>(`${this.apiUrl}/${id}`);
  }
}
