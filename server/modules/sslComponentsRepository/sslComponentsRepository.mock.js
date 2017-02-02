/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = function SSLComponentsRepository() {

  this.get = function () {
    return Promise.resolve({
      privateKey: `-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQCKqo+T1gWfmXO5sxVHECRmIK109holtPp9PnXWH01SP7zY1Syo
5MzLnewmsdXqlkp7jMQdAi4fDcbb4VCA9PX3roOcHQWL+tjCaLMAJ/24yff65cnL
YSpWSDSF79ijxPmEBlml273KT/+t53BIzGK5SDBoh3JMtjFTLz9HH+PFWwIDAQAB
AoGAEZmAS6U4ZX9WftVJ+BEGbafsHBI4U1zbBhZtYlXqvGu2jlbQKkeP7rAGjwq3
OeUFYxUEtyHVtL9M5A9+5j8xEKTCmrhCs0MeN3VccmvB6ePlNM49KAA5fZcf7xee
IIibarSqQwh5VAnLvb08KBNYk/rtDT9piMMAEl2uR5sJXwECQQDGti5Ny7Dm+vCZ
uztRAwBLUbtis/O2Jw7kgaObhACXlE2jgGQuLNq+OAzPfTx7FJ/35Nhjl8PXqdam
DHey+xlBAkEAsqTCHF69qSYwPoFY3nqEHmhtUyLyJ6x+lXLM7DTfC8nvSiLSbbls
Dp3ZUrxo+Hau50Dos27vJ4F5R/5jiym7mwJAJCwhvbOonkNr7PAyWgrr0MouDEep
w6zUfzBCMhsTaIRspajHk8hCgYH+gv7PNbCJdjzIT0jfM7ENC+kVGRWwgQJADm7v
W/lvm24Bcdtjgb4mVIqdYp0tMXVnWM3IrsDq0HoFQlkj5UeY6mloeJ3OYVy9buO4
qV6qJef5E48DHehGRwJBAKmSv8vkdcC6ITaal62Teuly68r/SN9GR40TkPRUALEQ
b8SAV6DI+hOqRW5bzSCiayKPUiDrNV6ZtqRfTHPHQ/o=
-----END RSA PRIVATE KEY-----`,
      certificate: `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCKqo+T1gWfmXO5sxVHECRmIK10
9holtPp9PnXWH01SP7zY1Syo5MzLnewmsdXqlkp7jMQdAi4fDcbb4VCA9PX3roOc
HQWL+tjCaLMAJ/24yff65cnLYSpWSDSF79ijxPmEBlml273KT/+t53BIzGK5SDBo
h3JMtjFTLz9HH+PFWwIDAQAB
-----END PUBLIC KEY-----`
    })
  };

};
