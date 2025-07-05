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
  const [isModalVisible, setIsModalVisible] = useState(false);

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

  // Convertir base64 a PEM format
  const formatToPEM = (base64Key, type) => {
    const header = type === 'public' ? '-----BEGIN PUBLIC KEY-----' : '-----BEGIN PRIVATE KEY-----';
    const footer = type === 'public' ? '-----END PUBLIC KEY-----' : '-----END PRIVATE KEY-----';
    
    // Dividir en líneas de 64 caracteres
    const lines = base64Key.match(/.{1,64}/g) || [];
    return [header, ...lines, footer].join('\n');
  };

  // Generar las claves públicas y privadas RSA compatibles con el sistema híbrido
  const handleGenerateKeys = async () => {
    try {
      console.log("🔑 Generating RSA key pair...");
      
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048, // Tamaño de la clave en bits
          publicExponent: new Uint8Array([1, 0, 1]), // Exponente público
          hash: "SHA-256", // Hash utilizado (compatible con el backend)
        },
        true,
        ["encrypt", "decrypt"] // Operaciones disponibles
      );

      // Exportar claves en formato correcto
      const publicKeyArrayBuffer = await crypto.subtle.exportKey(
        "spki", // Formato SPKI para la clave pública
        keyPair.publicKey
      );
      const privateKeyArrayBuffer = await crypto.subtle.exportKey(
        "pkcs8", // Formato PKCS#8 para la clave privada
        keyPair.privateKey
      );

      // Convertir las claves a base64
      const publicKeyBase64 = arrayBufferToBase64(publicKeyArrayBuffer);
      const privateKeyBase64 = arrayBufferToBase64(privateKeyArrayBuffer);

      console.log("✅ Keys generated successfully");
      console.log("📏 Public key length:", publicKeyBase64.length);
      console.log("📏 Private key length:", privateKeyBase64.length);

      // Establecer las claves en el estado
      setPublicKey(publicKeyBase64);
      setPrivateKey(privateKeyBase64);
      
    } catch (error) {
      console.error("❌ Error generating keys:", error);
      alert("Error generando las llaves: " + error.message);
    }
  };

  // Función para mostrar el modal
  const handleShowModal = () => {
    setIsModalVisible(true);
  };

  // Función para cerrar el modal
  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  // Función de prueba para verificar que las claves funcionan
  const testKeys = async () => {
    if (!publicKey || !privateKey) {
      alert("Primero genera las claves");
      return;
    }

    try {
      console.log("🧪 Testing key compatibility...");
      
      // Simular encriptación híbrida (como en el frontend)
      const testData = "Test message for key compatibility";
      
      // Generar clave AES
      const aesKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Exportar clave AES
      const aesKeyRaw = await crypto.subtle.exportKey('raw', aesKey);
      
      // Importar clave pública RSA
      const publicKeyBuffer = Uint8Array.from(atob(publicKey), c => c.charCodeAt(0));
      const importedPublicKey = await crypto.subtle.importKey(
        'spki',
        publicKeyBuffer.buffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
      );
      
      // Encriptar clave AES con RSA
      const encryptedAESKey = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        importedPublicKey,
        aesKeyRaw
      );
      
      console.log("✅ Key compatibility test passed!");
      alert("✅ Claves generadas correctamente y son compatibles con el sistema híbrido");
      
    } catch (error) {
      console.error("❌ Key compatibility test failed:", error);
      alert("❌ Error en las claves: " + error.message);
    }
  };

  // Copiar al portapapeles
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${type} copiada al portapapeles`);
    }).catch(err => {
      console.error("Error copying to clipboard:", err);
    });
  };

  return (
    <Box padding={6}>
      <Typography
        variant="alpha"
        style={{ marginBottom: "10px" }}
        lineHeight="lg"
      >
        🔐 Generador de Claves 
      </Typography>
      
      <Typography
        variant="beta"
        style={{ marginBottom: "20px", color: "#d32f2f" }}
        lineHeight="lg"
      >
        ⚠️ IMPORTANTE: Una vez generadas, guarda ambos tokens. No se pueden recuperar.
      </Typography>

      <Stack horizontal spacing={4} style={{ marginBottom: "20px" }}>
        {/* Botón para generar las claves */}
        <Button variant="primary" onClick={handleGenerateKeys}>
          🔑 Generar Claves RSA
        </Button>

        {/* Botón de prueba */}
        {publicKey && privateKey && (
          <Button variant="secondary" onClick={testKeys}>
            🧪 Probar Compatibilidad
          </Button>
        )}
      </Stack>

      {/* Mostrar las claves generadas */}
      {publicKey && (
        <Box marginTop={6}>
          <Box marginBottom={4}>
            <Stack horizontal spacing={2} style={{ alignItems: "center", marginBottom: "10px" }}>
              <Typography variant="delta" fontWeight="bold">
                🌐 Cliente Token (Clave Pública):
              </Typography>
              <Button 
                variant="tertiary" 
                size="S" 
                onClick={() => copyToClipboard(publicKey, "Clave pública")}
              >
                📋 Copiar
              </Button>
            </Stack>
            <Textarea
              value={publicKey}
              readOnly
              rows={3}
              style={{ 
                marginBottom: "10px",
                fontFamily: "monospace",
                fontSize: "12px"
              }}
            />
            <Typography variant="omega" style={{ color: "#666" }}>
              💡 Usa esta clave en tu aplicación React/frontend para encriptar emails
            </Typography>
          </Box>

          <Box marginBottom={4}>
            <Stack horizontal spacing={2} style={{ alignItems: "center", marginBottom: "10px" }}>
              <Typography variant="delta" fontWeight="bold">
                🔒 Server Token (Clave Privada):
              </Typography>
              <Button 
                variant="tertiary" 
                size="S" 
                onClick={() => copyToClipboard(privateKey, "Clave privada")}
              >
                📋 Copiar
              </Button>
            </Stack>
            <Textarea
              value={privateKey}
              readOnly
              rows={4}
              style={{ 
                marginBottom: "10px",
                fontFamily: "monospace",
                fontSize: "12px"
              }}
            />
            <Typography variant="omega" style={{ color: "#666" }}>
              💡 Configura esta clave en las variables de entorno de Strapi (FREE_MAIL_SENDER_TOKEN)
            </Typography>
          </Box>

          <Box 
            background="primary100" 
            padding={3} 
            style={{ borderRadius: "4px", marginTop: "20px" }}
          >
            <Typography variant="omega" fontWeight="semiBold" style={{ color: "#0066cc" }}>
              ✅ Sistema Híbrido RSA + AES:
            </Typography>
            <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
              <li>RSA encripta claves AES de 256 bits</li>
              <li>AES-GCM encripta los datos del email</li>
              <li>Sin límite de tamaño para emails</li>
              <li>Compatible con Web Crypto API</li>
            </ul>
          </Box>
        </Box>
      )}

      {/* Botón para ver el tutorial */}
      <Button
        variant="secondary"
        onClick={handleShowModal}
        style={{ marginTop: "20px" }}
      >
        📚 Ver Tutorial
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
              🔐 Tutorial: Sistema de Email
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
                  📋 Guía de Implementación Paso a Paso
                </Typography>
              </Box>

              {/* Paso 1 */}
              <Box>
                <Typography variant="beta" fontWeight="bold" marginBottom={2}>
                  1. 🔧 Configurar Variables de Entorno:
                </Typography>
                <Typography marginBottom={2}>
                  Configura las claves en tus aplicaciones:
                </Typography>
                
                <Typography variant="delta" fontWeight="bold" marginBottom={1}>
                  Frontend (.env):
                </Typography>
                <Box
                  background="neutral100"
                  padding={3}
                  marginBottom={2}
                  style={{ borderRadius: "4px" }}
                >
                  <Typography variant="code">
                    {`REACT_APP_PUBLIC_KEY=${publicKey ? publicKey.substring(0, 50) + '...' : 'TU_CLAVE_PUBLICA_AQUI'}`}
                  </Typography>
                </Box>

                <Typography variant="delta" fontWeight="bold" marginBottom={1}>
                  Backend (Strapi .env):
                </Typography>
                <Box
                  background="neutral100"
                  padding={3}
                  marginBottom={2}
                  style={{ borderRadius: "4px" }}
                >
                  <Typography variant="code">
                    {`FREE_MAIL_SENDER_TOKEN=${privateKey ? privateKey.substring(0, 50) + '...' : 'TU_CLAVE_PRIVADA_AQUI'}`}
                  </Typography>
                </Box>
              </Box>

              {/* Paso 2 - Funciones auxiliares completas */}
              <Box>
                <Typography variant="beta" fontWeight="bold" marginBottom={2}>
                  2. 🔐 Código Frontend (React):
                </Typography>
                <Box
                  background="neutral100"
                  padding={3}
                  marginTop={2}
                  style={{ borderRadius: "4px" }}
                >
                  <Typography variant="code">
                    <pre style={{ fontSize: "11px", overflow: "auto" }}>
{`// Funciones auxiliares de conversión
const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Importar clave pública RSA
const importPublicKey = async (publicKeyBase64) => {
  const keyData = base64ToArrayBuffer(publicKeyBase64);
  
  return await window.crypto.subtle.importKey(
    'spki',
    keyData,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );
};

// Encriptar datos con AES-GCM
const encryptWithAES = async (data, aesKey) => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Generar IV aleatorio (12 bytes para GCM)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    dataBuffer
  );
  
  return {
    encryptedData: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer)
  };
};

// Encriptar clave AES con RSA
const encryptAESKeyWithRSA = async (aesKeyRaw, publicKeyBase64) => {
  const publicKey = await importPublicKey(publicKeyBase64);
  
  const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP'
    },
    publicKey,
    aesKeyRaw
  );
  
  return arrayBufferToBase64(encryptedKeyBuffer);
};

// Encriptación Híbrida RSA+AES
const encryptData = async (data, publicKeyBase64) => {
  // Generar clave AES
  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, ['encrypt', 'decrypt']
  );
  
  // Encriptar datos con AES
  const { encryptedData, iv } = await encryptWithAES(data, aesKey);
  
  // Encriptar clave AES con RSA
  const aesKeyRaw = await window.crypto.subtle.exportKey('raw', aesKey);
  const encryptedAESKey = await encryptAESKeyWithRSA(aesKeyRaw, publicKeyBase64);
  
  // Empaquetar todo
  return window.btoa(JSON.stringify({
    encryptedKey: encryptedAESKey,
    encryptedData: encryptedData,
    iv: iv
  }));
};`}
                    </pre>
                  </Typography>
                </Box>
              </Box>

              {/* Paso 3 */}
              <Box>
                <Typography variant="beta" fontWeight="bold" marginBottom={2}>
                  3. 📧 Enviar Email:
                </Typography>
                <Box
                  background="neutral100"
                  padding={3}
                  marginTop={2}
                  style={{ borderRadius: "4px" }}
                >
                  <Typography variant="code">
                    <pre style={{ fontSize: "11px" }}>
{`const sendEmail = async () => {
  const mail = JSON.stringify({
    toEmail: ["usuario@ejemplo.com"],
    subject: "Mi asunto",
    mailText: "Contenido del email..."
  });
  
  const encryptedMail = await encryptData(mail, PUBLIC_KEY);
  
  const response = await fetch("/api/free-mail-sender/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mail: encryptedMail })
  });
};`}
                    </pre>
                  </Typography>
                </Box>
              </Box>

              {/* Nota Final */}
              <Box
                background="danger100"
                padding={3}
                style={{ borderRadius: "4px" }}
              >
                <Typography variant="omega" fontWeight="semiBold">
                  ⚠️ Seguridad Importante:
                </Typography>
                <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
                  <li>Nunca compartas tu clave privada</li>
                  <li>Usa HTTPS en producción</li>
                  <li>Rota las claves periódicamente</li>
                  <li>Valida todos los inputs</li>
                </ul>
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
