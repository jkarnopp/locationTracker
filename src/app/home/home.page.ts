import { Component, ViewChild, ElementRef,AfterContentInit,OnInit } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Storage } from '@ionic/storage';
 
declare var google;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, AfterContentInit{

  @ViewChild('mapElement') mapElement: ElementRef;
  map: any;
  currentMapTrack = null;
 latLng: string;
  isTracking = false;
  trackedRoute = [];
  previousTracks = [];
  maxZoomService: any;
  zoom:number = 16;
 
  positionSubscription: Subscription;
 
  constructor(public navCtrl: NavController, private plt: Platform, private geolocation: Geolocation, private storage: Storage) { }
 
  ngOnInit(): void {
  }

  ngAfterContentInit() {
    this.plt.ready().then(() => {
      this.loadHistoricRoutes();
 
      let mapOptions = {
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      }
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

      this.maxZoomService = new google.maps.MaxZoomService();
  
 
      this.geolocation.getCurrentPosition().then((pos) => {
        let latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        this.map.setCenter(latLng);
        
        this.map.setZoom(20);
        console.log("lat: " + pos.coords.latitude);
        console.log("zoom: " + this.getMaxZoom(latLng));
      }).catch((error) => {
        console.log('Error getting location', error);
        
      });
    });
  }

async getMaxZoom(latLng:any) {
    var result = await this.maxZoomService.getMaxZoomAtLatLng(latLng, function(response) {
      console.log(response.zoom);
      if (response.status === 'OK') {
        return response.zoom;
      } 
      return  16;
      
    });
  }
 
  loadHistoricRoutes() {
    this.storage.get('routes').then(data => {
      if (data) {
        this.previousTracks = data;
      }
    });
  }

  startTracking() {
    this.isTracking = true;
    this.trackedRoute = [];
 
    this.positionSubscription = this.geolocation.watchPosition()
      .pipe(
        filter((p) => p.coords !== undefined) //Filter Out Errors
      )
      .subscribe(data => {
        setTimeout(() => {
          this.trackedRoute.push({ lat: data.coords.latitude, lng: data.coords.longitude });
          this.redrawPath(this.trackedRoute);
          this.latLng = "lat: " + data.coords.latitude + " - " + "lng: " + data.coords.longitude;
        }, 0);
      });
 
  }

  stopTracking() {
    let newRoute = { finished: new Date().getTime(), path: this.trackedRoute };
    this.previousTracks.push(newRoute);
    this.storage.set('routes', this.previousTracks);
   
    this.isTracking = false;
    this.positionSubscription.unsubscribe();
    this.currentMapTrack.setMap(null);
  }
 
  showHistoryRoute(route) {
    this.redrawPath(route);
  }

  redrawPath(path) {
    if (this.currentMapTrack) {
      this.currentMapTrack.setMap(null);
    }
 
    if (path.length > 1) {
      this.currentMapTrack = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#ff00ff',
        strokeOpacity: 1.0,
        strokeWeight: 3
      });
      this.currentMapTrack.setMap(this.map);
    }
  }
}
