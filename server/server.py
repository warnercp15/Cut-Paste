#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# pythones.net

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
            print("Cargar Objeto")
            conection.saveImage(data)
            return jsonify({"status":"ok"})
    except ValueError as err:
        print(err)

if __name__ == "__main__":
    app.run(host='192.168.1.186')