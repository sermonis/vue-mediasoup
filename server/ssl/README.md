# Enable HTTPS for Localhost

To get a self-signed SSL certificate for localhost, you'll need to add the certificate to the system's trusted root certificate store. Here's how to do it:

## Setup

See [Getting Chrome to Accept Self-signed Localhost Certificate](https://betterstack.com/community/questions/getting-chrome-to-accept-self-signed-localhost-certificate/).

- Generate a self-signed SSL/TLS certificate using the OpenSSL utility:

```shell
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout localhost.key -out localhost.crt -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:0.0.0.0"
```

- Copy the localhost.crt file to the /usr/local/share/ca-certificates/ directory with superuser privileges to add a custom SSL/TLS certificate to the system's trusted certificate store:

```shell
sudo cp localhost.crt /usr/local/share/ca-certificates/localhost.crt
```

- Update the system's trusted certificate store, to ensure that the system's certificate store is up-to-date and includes the newly added certificate.

```shell
sudo update-ca-certificates
```

- Change the file permissions of the localhost.key and localhost.crt files. The 777 argument sets the permissions for the owner, group, and others to read, write, and execute the files.

```shell
sudo chmod 777 localhost.key && sudo chmod 777 localhost.crt
```

- Verify the validity of the localhost.crt SSL/TLS certificate using the OpenSSL utility. It should be like this: localhost.crt: OK

```shell
openssl verify localhost.crt
```

