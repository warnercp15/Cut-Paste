import { Component } from '@angular/core';
import { Plugins, CameraResultType, CameraSource } from '@capacitor/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { HTTP } from '@ionic-native/http/ngx';
import { environment } from 'src/environments/environment';
const { Camera,Device } = Plugins;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  isApp:any;
  private photo:SafeResourceUrl;

  constructor(private sanitizer:DomSanitizer,private http: HTTP) {}  

  async ngOnInit() {
    const info =  Device.getInfo();
    info["__zone_symbol__value"]["operatingSystem"]=="windows"?this.isApp=false:this.isApp=true;
    if (this.isApp){
      console.log("Device");
    }else{
      console.log("Web");
	  }
  }

  async takePicture() {
    const image = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    });
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(image && (image.dataUrl));
    let file={
      "data":image.dataUrl,
      "cut":false
    }
	  this.fail(file);
  }

  fail(file) {
    let imageRetry = 0;
    while(imageRetry < 1){
		imageRetry++;

    let headers = {
        'Content-Type': 'application/json'
    };

		this.http.setDataSerializer('json');
    this.http.post(`http://${environment.ip}:5000/pushImage`, file, headers)
      .then((data) => {
        console.log(data)
      })
      .catch((error) => {
      console.log(error);
      });
		}
  }
}
