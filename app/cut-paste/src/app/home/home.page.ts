import { Component } from '@angular/core';
import { Plugins, CameraResultType, CameraSource } from '@capacitor/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { HTTP } from '@ionic-native/http/ngx';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import html2canvas from 'html2canvas';
import { UserIdleService } from 'angular-user-idle';
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

  constructor(private sanitizer:DomSanitizer,private http: HTTP,private _http: HttpClient,private userIdle: UserIdleService) {}  

  async ngOnInit() {
    const info =  Device.getInfo();
    info["__zone_symbol__value"]["operatingSystem"]=="windows"?this.isApp=false:this.isApp=true;
    if (this.isApp){
      console.log("Device");
    }else{
      console.log("Web");
      this.userIdle.startWatching();
      this.userIdle.ping$.subscribe(() =>  {console.log("Refresh");this.actualizarBack();});
	  }
  }

  textToSpeech(texto:string){
    let vocesDisponibles = speechSynthesis.getVoices();
    const IDIOMAS_PREFERIDOS = ["es-MX", "es-US", "es-ES", "es_US", "es_ES"];
    let posibleIndice = vocesDisponibles.findIndex(voz => IDIOMAS_PREFERIDOS.includes(voz.lang));
    let mensaje = new SpeechSynthesisUtterance();
    mensaje.volume = 1; // de 0-1 float
    mensaje.rate = 0.8;  //velocidad de habla float 0.1-10.0 float
    mensaje.voice = vocesDisponibles[posibleIndice];  //voz disponile seleccionada del navegador
    mensaje.text = texto;
    mensaje.pitch = 0;  //tono de voz 0-2 foat 
    // hablar!
    //var listaVoces=responsiveVoice.getVoices();
    
    //responsiveVoice.speak(texto, "Spanish Male");
    speechSynthesis.speak(mensaje);
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
    html2canvas(document.body).then(canvas => {
      let file={"data":canvas.toDataURL()};
      this._http.post(`http://${environment.URL}/back`,file).subscribe((response) => {
        console.log(response);
      });
    });
  }

  saveImage(){
    html2canvas(document.body).then(canvas => {
      var link = document.createElement('a');
      link.download = 'image.png';
      link.href = canvas.toDataURL();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
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
