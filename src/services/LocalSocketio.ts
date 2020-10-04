import { Subscribe } from "../model/Binance";
import TradeBroker from "../server";

export default class LocalSocketio {

    private connectCounter = 0;
    private logTopic = "logd0c053";

    private io!: SocketIO.Server;

    public init(io: SocketIO.Server) {
        this.io = io;
        this.io.on("connection", async (socket: SocketIO.Socket) => {
            this.log("connection count is: " + ++this.connectCounter + " with  ip:" + socket.handshake.address);

            socket.on("subscribe", (message: any) => {
                try {
                    const msg: Subscribe = JSON.parse(message);
                    msg.params.forEach((i) => { socket.join(this.binanceMaper(i)); });
                    socket.emit(JSON.stringify({ result: null, id: msg.id }));
                    this.log("client subscribed to: " + msg.params.length + " events");
                    this.updateCoreCoin(msg.params);
                } catch (error) {
                    socket.emit(JSON.stringify({ result: "error", id: message.id ? message.id : 0 }));
                }

            });

            socket.on("unsubscribe", (message: any) => {
                try {
                    const msg: Subscribe = JSON.parse(message);
                    msg.params.forEach((i) => { socket.leave(this.binanceMaper(i)); });
                    socket.emit("", JSON.stringify({ result: null, id: msg.id }));
                    this.log("client unsubscribed to: " + msg.params.length + " events");
                    this.updateCoreCoin(msg.params);
                } catch (error) {
                    socket.emit(JSON.stringify({ result: "error", id: message.id ? message.id : 0 }));
                }
            });

            socket.on(this.logTopic, () => {
                let count = 0;
                if (this.io.sockets.adapter.rooms[this.logTopic]) {
                    count = this.io.sockets.adapter.rooms[this.logTopic].length;
                }
                socket.join(this.logTopic);
                this.log(`log room have ${++count} member now`);
            });

            socket.on("disconnect", () => {
                this.log("disconnect. connection count is: " + --this.connectCounter);
            });

        });

        // this.io.on("disconnect", (socket: SocketIO.Socket) => {
        //     console.log("disconnect. connection count is: " + --this.connectCounter);
        // });

        // this.io.on("message", (msg: any) => {
        //     console.log("connection rec is: " + msg);
        // });

        // this.io.on("error", () => {
        //     console.log("error. connection count is: " + --this.connectCounter);
        // });
    }

    public emitToSubscriber(topic: string, msg: string) {
        this.io.in(topic).emit(msg);
    }

    public emitToOne(socket: SocketIO.Socket, msg: string) {
        socket.emit(msg);
    }

    public emitToAll(msg: string) {
        this.io.to("all").emit(msg);
    }

    public emitToLog(msg: string) {
        this.io.to(this.logTopic).emit(msg);
    }

    public log(msg: string) {
        const message = new Date().toLocaleString() + " - " + msg;
        console.log(message);
        this.emitToLog(message);
    }

    public binanceMaper(type: string) {
        const splitted = type.split("@", 2);
        let SelType = splitted[1];
        switch (splitted[1]) {
            case "ticker":
                SelType = "24hrTicker";
                break;
            case "depth":
            case "depth20":
            case "depth10":
            case "depth5":
                SelType = "depth20@1000ms";
                break;
            default:
                SelType = splitted[1];
                break;
        }
        return splitted[0].toUpperCase() + "@" + SelType;
    }

    private updateCoreCoin(msg: string[]) {
        let needUpdateFlag = false;
        msg.forEach((i) => {
            const coin = i.split("@", 1)[0];
            if (!this.coinIsExist(coin)) {
                this.addCoin(coin);
                needUpdateFlag = true;
                this.log("new coin added :" + coin);
            }
        });
    }

    private coinIsExist(coin: string) {
        return TradeBroker.coins.findIndex((x) => coin === x) >= 0 ? true : false;
    }

    private addCoin(coin: string) {
        return TradeBroker.newCoins.push(coin);
    }

}
