import React, { useState } from "react";
import { Button, Box, Typography, Textarea } from "@strapi/design-system";
import {
  ModalLayout,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from "@strapi/design-system/ModalLayout";
import { Stack } from "@strapi/design-system/Stack";

const HomePage = () => {
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false); // Estado para controlar la visibilidad del modal

  // Generar las claves públicas y privadas RSA
  const handleGenerateKeys = async () => {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048, // Tamaño de la clave en bits
          publicExponent: new Uint8Array([1, 0, 1]), // Exponente público
          hash: "SHA-256", // Hash utilizado
        },
        true,
        ["encrypt", "decrypt"] // Operaciones disponibles
      );

      const publicKeyArrayBuffer = await crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
      );
      const privateKeyArrayBuffer = await crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );

      // Convertir las claves a base64
      const publicKeyBase64 = arrayBufferToBase64(publicKeyArrayBuffer);
      const privateKeyBase64 = arrayBufferToBase64(privateKeyArrayBuffer);

      // Establecer las claves en el estado
      setPublicKey(publicKeyBase64);
      setPrivateKey(privateKeyBase64);
    } catch (error) {
      console.error("Error generando las llaves:", error);
    }
  };

  // Función auxiliar para convertir ArrayBuffer a base64
  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const length = bytes.byteLength;
    for (let i = 0; i < length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Función para mostrar el modal
  const handleShowModal = () => {
    setIsModalVisible(true);
  };

  // Función para cerrar el modal
  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  // Función para cifrar el cuerpo de la solicitud con la clave pública RSA
  async function encryptData(publicKeyBase64, data) {
    const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), (c) =>
      c.charCodeAt(0)
    );
    const publicKey = await crypto.subtle.importKey(
      "spki",
      publicKeyBuffer.buffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256", // Hash utilizado
      },
      false,
      ["encrypt"]
    );

    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    const encryptedData = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encodedData
    );

    return encryptedData;
  }

  // Función para enviar la solicitud cifrada
  async function sendRequest(publicKeyBase64, data) {
    try {
      const encryptedData = await encryptData(publicKeyBase64, data);

      // Realizar la petición a la API de Strapi
      const response = await fetch(
        "http://localhost:1332/api/free-mail-sender/send-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            encryptedBody: btoa(
              String.fromCharCode(...new Uint8Array(encryptedData))
            ), // Convertir el cifrado a base64
          }),
        }
      );

      const responseData = await response.json();
      console.log("Respuesta de la API:", responseData);
    } catch (error) {
      console.error("Error al enviar la petición:", error);
    }
  }

  return (
    <Box padding={6}>
      <Typography
        variant="beta"
        style={{ marginBottom: "20px" }}
        lineHeight="lg"
      >
        NOTA: UNA VEZ GENERADOS, GUARDA LOS TOKEN. NO SE PUEDEN RECUPERAR
      </Typography>

      {/* Botón para generar las claves */}
      <Button variant="secondary" onClick={handleGenerateKeys}>
        Generar Token
      </Button>

      {/* Mostrar las claves generadas */}
      {publicKey && (
        <Box marginTop={6}>
          <Typography variant="delta">Clave Pública:</Typography>
          <Textarea
            value={publicKey}
            readOnly
            rows={2}
            style={{ marginBottom: "20px" }}
          />

          <Typography variant="delta">Clave Privada:</Typography>
          <Textarea
            value={privateKey}
            readOnly
            rows={2}
            style={{ marginBottom: "20px" }}
          />
        </Box>
      )}

      <Typography variant="omega" style={{ marginTop: "20px" }}>
        Utiliza las llaves generadas para firmar tus requests y proteger tus
        datos.
      </Typography>

      {/* Botón para ver el tutorial */}
      <Button
        variant="primary"
        onClick={handleShowModal}
        style={{ marginTop: "20px" }}
      >
        Ver Tutorial
      </Button>

      {/* Modal para el tutorial */}
      {isModalVisible && (
        <ModalLayout
          onClose={handleCloseModal}
          labelledBy="tutorial-modal-title"
        >
          <ModalHeader>
            <Typography
              fontWeight="bold"
              textColor="neutral800"
              as="h2"
              id="tutorial-modal-title"
            >
              Cómo usar tus Tokens
            </Typography>
          </ModalHeader>
          <ModalBody>
            <Stack spacing={2}>
              <Box
                style={{
                  padding: "16px",
                  backgroundColor: "#32324d",
                  color: "#fff",
                }}
              >
                <Typography variant="SIGMA" fontWeight="bold">
                  <b>Pasos:</b>
                </Typography>
                <Typography>
                  1. Guarda las llaves generadas.
                  <br />
                  2. Utiliza la clave pública en el frontend para cifrar los
                  datos.
                  <br />
                  3. Envía las peticiones cifradas al servidor.
                  <br />
                  4. El servidor utiliza la clave privada para descifrar la
                  información y procesar la petición.
                </Typography>
                <br />
                <Typography variant="SIGMA" fontWeight="bold">
                  <b>Ejemplo de Código:</b>
                </Typography>
                <Typography>
                  A continuación, se muestra un ejemplo de cómo cifrar la
                  información con la clave pública generada y cómo realizar una
                  petición al endpoint.
                </Typography>
                <pre>
                  <code>{`// Datos a cifrar
const data = {
  "toEmail": ["mail@mail.com"],
  "subject": "Important subject",
  "mailText": "<p><b>HTML</b> content</p>"
};

// Función para cifrar datos con la clave pública
async function encryptData(publicKeyBase64, data) {
  const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
  const publicKey = await crypto.subtle.importKey(
    "spki",
    publicKeyBuffer.buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    false,
    ["encrypt"]
  );

  const encodedData = new TextEncoder().encode(JSON.stringify(data));
  const encryptedData = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encodedData
  );

  return encryptedData;
}

// Función para enviar el request
async function sendRequest(publicKeyBase64, data) {
  try {
    const encryptedData = await encryptData(publicKeyBase64, data);

    // Realizar la petición a la API de Strapi
    const response = await fetch("http://localhost:1332/api/free-mail-sender/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        encryptedBody: btoa(String.fromCharCode(...new Uint8Array(encryptedData))) // Cifrado en base64
      })
    });

    const responseData = await response.json();
    console.log("Respuesta de la API:", responseData);
  } catch (error) {
    console.error("Error al enviar la petición:", error);
  }
}

// Llamada a la función con la clave pública y los datos
sendRequest("${publicKey}", data);`}</code>
                </pre>
              </Box>
            </Stack>
          </ModalBody>
          <ModalFooter
            startActions={
              <Button onClick={handleCloseModal} variant="tertiary">
                Cerrar
              </Button>
            }
          />
        </ModalLayout>
      )}
    </Box>
  );
};

export default HomePage;
