import {schedule} from "node-cron";
import everyMinute from "./RunEveryMinute";
import {runCommandHandler} from "@/utils/handlers";

const cronOptions = {runOnInit: true};

export default function commands() {
    // schedule("* * * * *", runCommandHandler(everyMinute), cronOptions);
}
