import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  ngOnInit(): void {
    // Purge obsolete legacy localStorage keys from pre-Firebase era
    const obsoleteKeys = [
      'hc_access_token',
      'hc_refresh_token',
      'hc_user_profile',
      'hc_period_logs',
      'hc_shop_custom_products',
      'hc_shop_cart',
      'hc_shop_wishlist',
      'hc_shop_addresses',
      'hc_shop_orders'
    ];
    obsoleteKeys.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });
  }
}
