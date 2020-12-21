/// <reference path="../../../globals.d.ts" />

import { Component } from '@angular/core';
import { Plugins, CameraResultType, CameraSource } from '@capacitor/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import html2canvas from 'html2canvas';
const { Camera,Device } = Plugins;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  listaImagenes:any=[]
  isApp:any;
  cut;
  action:string;
  socket:any;
  photo:SafeResourceUrl;

  constructor(private sanitizer:DomSanitizer) {}  

  async ngOnInit() {

    this.cut="false";
    this.action="Take image";

    this.socket = io.connect("http://192.168.0.107:5000");

		this.socket.on('getImages', (data) => {
      this.listaImagenes=data;
    });

    this.socket.on('getBack',() => {
      this.isApp?null:this.screeshot();
    });
    
    this.socket.on('limpio', (data) => {
      this.listaImagenes=data;
      this.screeshot();
    });

    this.socket.emit('getData');

    const info =  Device.getInfo();
    info["__zone_symbol__value"]["operatingSystem"]=="windows"?this.isApp=false:this.isApp=true;
    this.isApp?console.log("Device"):console.log("Web");
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
    this.listaImagenes=[];
    this.socket.emit('limpiar');
  }

  screeshot(){
    html2canvas(document.body).then(canvas => {
      let file={"data":canvas.toDataURL()};
      this.socket.emit('back',file);
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
    this.cut? this.action="Take coordinates":this.action="Take image";
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
    this.cut=!this.cut;
    this.cut? this.action="Take coordinates":this.action="Take image";
    this.socket.emit('pushImage',file);
  }
}
