import { Component } from '@angular/core';
import { Plugins, CameraResultType, CameraSource } from '@capacitor/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { HTTP } from '@ionic-native/http/ngx';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import html2canvas from 'html2canvas';
const { Camera,Device } = Plugins;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  listaImagenes:any
  isApp:any;
  cut=false;
  private photo:SafeResourceUrl;

  constructor(private sanitizer:DomSanitizer,private http: HTTP,private _http: HttpClient) {}  

  async ngOnInit() {
    const info =  Device.getInfo();
    console.log(info);
    info["_zone_symbol_value"]["operatingSystem"]=="windows"?this.isApp=false:this.isApp=true;
    if (this.isApp){
      console.log("Device");
    }else{
      console.log("Web");
      this.actualizarBack()
	  }
  }

  limpiar(){
    this._http.get(`http://${environment.URL}/limpiar`).subscribe((response) => {
      this.listaImagenes=response;
      console.log(this.listaImagenes);
      this.screeshot();
    });
  }

  actualizarBack(){
    this.getImages();
    this.screeshot();
  }

  getImages(){
    this._http.get(`http://${environment.URL}/getImages`).subscribe((response) => {
      this.listaImagenes=response;
      console.log(this.listaImagenes);
    });
  }

  screeshot(){
    setTimeout( () => {
      html2canvas(document.body).then(canvas => {
        let file={"data":canvas.toDataURL()};
        this._http.post(`http://${environment.URL}/back`,file).subscribe((response) => {
          console.log(response);
        });
      });
    }, 3000);
  }

  take(){
    this.cut=!this.cut;
    alert(this.cut);
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
      "cut":this.cut
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
    this.http.post(`http://${environment.URL}/pushImage`, file, headers)
      .then((data) => {
        this.cut=!this.cut;
      })
      .catch((error) => {
      console.log(error);
      });
		}
  }
}