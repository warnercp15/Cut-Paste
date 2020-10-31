#!/usr/bin/env python
# -*- coding: utf-8 -*-
#

from flask import Flask, request, jsonify
from flask_cors import CORS
import conection

app = Flask(__name__)
CORS(app)

@app.route("/pushImage", methods=['POST'])
def pushImage():
    try:
        if request.method == 'POST':
            data = request.json
            if (data['cut']==True):
                print("Guardar Coordenadas")
                conection.cut(data)
            else:
                print("Guardar Objeto")
                conection.saveImage(data)
            return jsonify({"status":"ok"})
    except ValueError as err:
        print(err)

@app.route("/back", methods=['POST'])
def back():
    if request.method == 'POST':
        data = request.json
        conection.background(data)
        return jsonify({"status": "ok"})

@app.route("/getImages", methods=['GET'])
def getImages():
    return jsonify(conection.getImages())

@app.route("/limpiar", methods=['GET'])
def limpiar():
    return jsonify(conection.limpiar())


if __name__ == "__main__":
    app.run(host='192.168.1.129')