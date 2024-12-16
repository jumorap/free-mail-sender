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
          <Typography variant="delta">Front-end token:</Typography>
          <Textarea
            value={publicKey}
            readOnly
            rows={2}
            style={{ marginBottom: "20px" }}
          />

          <Typography variant="delta">Back-end token:</Typography>
          <Textarea
            value={privateKey}
            readOnly
            rows={2}
            style={{ marginBottom: "20px" }}
          />
        </Box>
      )}

      <Typography variant="omega" style={{ marginTop: "20px" }}>
        Estos tokens son necesarios para cifrar y descifrar los datos enviados
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
            <Stack spacing={4}>
              <Box
                style={{
                  padding: "16px",
                  backgroundColor: "#32324d",
                  color: "#fff",
                  borderRadius: "4px",
                }}
              >
                <Typography variant="sigma" fontWeight="bold" color="white">
                  Tutorial Paso a Paso
                </Typography>
              </Box>

              {/* Paso 1 */}
              <Box>
                <Typography variant="beta" fontWeight="bold" marginBottom={2}>
                  1. Configurar el Entorno:&nbsp;
                </Typography>
                <Typography>
                  Guarda el token generado como variable de entorno en tu
                  aplicación front-end. Este token se utilizará como clave
                  pública para cifrar los datos del correo.
                </Typography>
                <Box
                  background="neutral100"
                  padding={3}
                  marginTop={2}
                  style={{ borderRadius: "4px" }}
                >
                  <Typography variant="code">
                    {`REACT_APP_STRAPI_PUBLIC_KEY=MIIBIjANBgkqhkiG...vY6uieceP/3zswIDAQAB`}
                  </Typography>
                </Box>
              </Box>

              {/* Paso 2 */}
              <Box>
                <Typography variant="beta" fontWeight="bold" marginBottom={2}>
                  2. Cifrar Datos del Correo:&nbsp;
                </Typography>
                <Typography>
                  Utiliza la función encryptData con la clave pública generada
                  en Strapi.
                </Typography>
                <Box
                  background="neutral100"
                  padding={3}
                  marginTop={2}
                  style={{ borderRadius: "4px" }}
                >
                  <Typography variant="code">
                    <pre>
                      {`
const encryptData = (data, publicKey) => {
  /**
   * Encrypt the data using the public key
   * @param {String} data - The data to encrypt
   * @param {String} publicKey - The public key to encrypt the data
   * @returns {String} - The encrypted data
   */
  publicKey = \`-----BEGIN PUBLIC KEY-----\n\${publicKey}\n-----END PUBLIC KEY-----\`;
  const buffer = Buffer.from(data, "utf8");
  const encryptedData = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buffer
  );
  return encryptedData.toString("base64");
};
                    `}
                    </pre>
                  </Typography>
                </Box>

                <Box
                  background="neutral100"
                  padding={3}
                  marginTop={2}
                  style={{ borderRadius: "4px" }}
                >
                  <Typography variant="code">
                    {`const mail = { 
  mail: \`{"toEmail": ["\${EMAIL}"],"subject": "\${SUBJECT}","mailText": "\${MAIL_TEXT}"}\`
};`}
                  </Typography>
                </Box>

                <Box
                  background="neutral100"
                  padding={3}
                  marginTop={2}
                  style={{ borderRadius: "4px" }}
                >
                  <Typography variant="code">
                    {`const encryptedMail = encryptData(
  mail.mail, 
  process.env.REACT_APP_STRAPI_PUBLIC_KEY
);`}
                  </Typography>
                </Box>
              </Box>

              {/* Paso 3 */}
              <Box>
                <Typography variant="beta" fontWeight="bold" marginBottom={2}>
                  3. Enviar Correo Cifrado:&nbsp;
                </Typography>
                <Typography>
                  Realiza una petición POST al endpoint del plugin con los datos
                  cifrados.
                </Typography>
                <Box
                  background="neutral100"
                  padding={3}
                  marginTop={2}
                  style={{ borderRadius: "4px" }}
                >
                  <Typography variant="code">
                    <pre>
                      {`
const sendEncryptedMail = async (encryptedMail) => {
  const response = await fetch(
    "http://<STRAPI_URL>/api/free-mail-sender/send-email", 
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mail: encryptedMail })
    }
  );
};`}
                    </pre>
                  </Typography>
                </Box>
              </Box>

              {/* Nota Final */}
              <Box
                background="neutral200"
                padding={3}
                style={{ borderRadius: "4px" }}
              >
                <Typography variant="omega" fontWeight="semiBold">
                  Importante:&nbsp;
                </Typography>
                <Typography variant="small">
                  Asegúrate de manejar los errores y de no exponer tus claves
                  públicas y privadas.
                </Typography>
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
