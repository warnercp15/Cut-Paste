import base64
import numpy as np
import cv2
import os
import screenpoint
from skimage import io, img_as_float
from io import BytesIO
from PIL import Image

def saveImage(data): #guarda la imagen obtenida en la carpeta
    data=data['data'].split(',')[1]
    im = Image.open(BytesIO(base64.b64decode(data)))
    ruta='imagenes/'+str(getLastNum()+1)+'-0-0.png'
    im.save(ruta, 'PNG')

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

def background(data):
    data=data['data'].split(',')[1]
    im = Image.open(BytesIO(base64.b64decode(data)))
    ruta = 'back.png'
    im.save(ruta, 'PNG')
    return

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
                "y": int(filename.split('.')[0].split('-')[2])
            }
            lista.append(da)
    return lista

def limpiar():
    for filename in os.listdir("imagenes/"):
        #with open("imagenes/" + filename, "rb") as f:
        os.remove("imagenes/" + filename)
    return []

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
        y, x = screenpoint.project(view, screen)

        x-=int(x * 0.3 + DOC_OFFSET_X)
        y-=int(y * 0.6 + DOC_OFFSET_Y)

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
        os.remove('imagenes/'+str(getLastNum()-1)+'-0-0.png')
        os.remove('back.png')
        os.remove('view.jpg')

    except ValueError as err:
        print(err)