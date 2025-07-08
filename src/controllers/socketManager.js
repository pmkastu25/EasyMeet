import {Server} from "socket.io"

export const connectToSocket = (server) => {
    const io = new Server(server, {
        connectionStateRecovery: {}
    }); // node http server

    return io;
}