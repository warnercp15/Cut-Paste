from flask import Flask, request, jsonify
from flask_socketio import SocketIO
import base64
import numpy as np
import cv2
import os
import screenpoint
from skimage import io, img_as_float
from io import BytesIO
from PIL import Image
import requests

app = Flask(__name__)
app.config['SECRET_KEY'] = '12345'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet", always_connect=True)
port = int(os.environ.get("PORT", 5000))

@app.route("/")
def index():
    return "Hola desde el server de Cut-Paste"


@socketio.on('getData')
def getData():
    getImages()

@socketio.on('pushImage')
def pushImage(res):
    print("Push de algo")
    data = res

    if (data['cut']==True):
        print("Guardar Coordenadas")
        cut(data)
    else:
        print("Guardar Objeto")
        socketio.emit('getBack', broadcast=True)
        saveImage(data)

@socketio.on('back')
def back(res):
    print("Back recibido")
    data = res
    data = data['data'].split(',')[1]
    im = Image.open(BytesIO(base64.b64decode(data)))
    ruta = 'back.png'
    im.save(ruta, 'PNG')

def convert(imgN):
    print("\nEmpezando recorte de imagen")
    headers = {}
    files = {'data': open(imgN, 'rb')}
    res = requests.post('http://u2net-predictor.tenant-compass.global.coreweave.com', headers=headers, files=files)
    with open('mask.png', 'wb') as f:
        f.write(res.content)
    mask = Image.open('mask.png').convert("L")

    byteImgIO = BytesIO()
    byteImg = Image.open(imgN)
    byteImg.save(byteImgIO, "PNG")
    byteImgIO.seek(0)
    byteImg = byteImgIO.read()

    ref = Image.open(BytesIO(byteImg))
    empty = Image.new("RGBA", ref.size, 0)
    mask = mask.resize(ref.size)
    img = Image.composite(ref, empty, mask)
    img.save(imgN)
    os.remove('mask.png')

def cut(data):

    try:
        image = io.imread('./back.png')
        image = img_as_float(image)
        mean=np.mean(image)
        DOC_OFFSET_X = 20 * mean
        DOC_OFFSET_Y = 20 * mean

        data = data['data'].split(',')[1]
        im = Image.open(BytesIO(base64.b64decode(data)))
        ruta = 'view.jpg'
        im.save(ruta, 'JPEG')
        #cv2.imwrite(ruta, im)

        screen = cv2.imread('back.png', 0)

        print(np.mean(image))
        print(screen.shape[1])
        print(screen.shape[0])

        view = cv2.imread(ruta, 0)
        # Project centroid.
        x, y = screenpoint.project(view, screen)


        x-=int(x * 0.3 + DOC_OFFSET_X)
        y-=int(y * 0.3 + DOC_OFFSET_Y)

        if x<0:
            x=x*-1
        if y<0:
            y=y*-1

        print()
        print(x)
        print(y)

        im = Image.open(BytesIO(base64.b64decode(str(getLastImage()))))
        ruta = 'imagenes/'+str(getLastNum())+'-'+str(x)+'-'+str(y)+'.png'
        im.save(ruta, 'PNG')

        os.remove('imagenes/' + str(getLastNum() - 1) + '-0-0.png')
        #os.remove('back.png')
        #os.remove('view.jpg')
        getImages()

    except ValueError as err:
        print(err)


def saveImage(data): #guarda la imagen obtenida en la carpeta
    data=data['data'].split(',')[1]
    im = Image.open(BytesIO(base64.b64decode(data)))
    ruta='imagenes/'+str(getLastNum()+1)+'-0-0.png'
    im.save(ruta, 'PNG')
    convert(ruta)

def getImages():
    lista=[]
    for filename in os.listdir("imagenes/"):
        with open("imagenes/"+filename, "rb") as f:
            if filename.split('.')[0].split('-')[1]=="0" and filename.split('.')[0].split('-')[2]=="0":
                continue
            im_b64 = base64.b64encode(f.read())
            a=im_b64.decode('utf-8')
            da = {
                "img": a,
                "x": int(filename.split('.')[0].split('-')[1]),
                "y": int(filename.split('.')[0].split('-')[2]),
                "texto": "Imagen en posición " + str(int(filename.split('.')[0].split('-')[1])) + " coma " + str(
                    int(filename.split('.')[0].split('-')[2]))
            }
            lista.append(da)

    socketio.emit('getImages',lista, broadcast=True)

@socketio.on('limpiar')
def limpiar():
    for filename in os.listdir("imagenes/"):
        os.remove("imagenes/" + filename)
    socketio.emit('limpio',[],broadcast=True)

def getLastNum(): #retuna la cantidad de imagenes que hay
    num=0
    for filename in os.listdir("imagenes/"):
        with open("imagenes/" + filename, "rb") as f:
            num+=1
    return num

def getLastImage():
    num=getLastNum()
    for filename in os.listdir("imagenes/"):
        if str(filename.split('.')[0].split('-')[0])==str(num):
            with open("imagenes/" + filename, "rb") as f:
                im_b64 = base64.b64encode(f.read())
                ba64 = im_b64.decode('utf-8')
                return ba64

if __name__ == "__main__":
    socketio.run(app, host='192.168.0.107', debug=True, port=port)