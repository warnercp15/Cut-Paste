import base64
import os
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