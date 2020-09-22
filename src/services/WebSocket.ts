import TradeBroker from "../server";
import { Subscribe } from "./../model/Binance";

export default class LocalSocketio {

    private connectCounter = 0;

    private io!: SocketIO.Server;

    public init(io: SocketIO.Server) {
        this.io = io;
        io.on("connection", async (socket: SocketIO.Socket) => {
            console.log("connection count is: " + ++this.connectCounter);
            socket.on("subscribe", (message: any) => {
                const msg: Subscribe = JSON.parse(message);
                msg.params.forEach((i) => { socket.join(this.binanceMaper(i)); });
                console.log("client subscribed to: " + msg.params.length + " coins");
                this.updateCoreCoin(msg.params);
            });

            socket.on("unsubscribe", (message: any) => {
                const msg: Subscribe = JSON.parse(message);
                msg.params.forEach((i) => {
                    socket.leave(this.binanceMaper(i));
                });
                console.log("client unsubscribed to: " + msg.params.length + " coins");
                this.updateCoreCoin(msg.params);
            });
        });

        io.on("disconnect", (socket: SocketIO.Socket) => {
            console.log("connection count is: " + --this.connectCounter);
        });

        io.on("message", (msg: any) => {
            console.log("connection rec is: " + msg);
        });
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
                SelType = "depthUpdate";
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
                // console.log("add :" + coin);
            }
        });
        if (needUpdateFlag) {
            this.updateSubscribtion();
        }
    }

    private coinIsExist(coin: string) {
        return TradeBroker.coins.findIndex((x) => coin === x) >= 0 ? true : false;
    }

    private addCoin(coin: string) {
        return TradeBroker.coins.push(coin);
    }

    private updateSubscribtion() {
        // TradeBroker.needUpdateSubscribtion = true;
    }
}
