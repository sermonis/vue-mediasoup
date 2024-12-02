import net from "node:net";
import path from "node:path";
import os from "node:os";

const SOCKET_PATH_UNIX = '/tmp/mediasoup.sock';
const SOCKET_PATH_WIN = path.join('\\\\?\\pipe', process.cwd(), 'mediasoup');
const SOCKET_PATH = os.platform() === 'win32'? SOCKET_PATH_WIN : SOCKET_PATH_UNIX;

export default async function()
{
	const socket = net.connect(SOCKET_PATH);

	process.stdin.pipe(socket);
	socket.pipe(process.stdout);

	socket.on('connect', () => process.stdin.setRawMode(true));
	socket.on('close', () => process.exit(0));
	socket.on('exit', () => socket.end());
};
