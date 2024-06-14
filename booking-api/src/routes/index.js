import authRouter from "./auth";
import userRouter from "./user";
import bookingRouter from "./booking";
import groupRouter from "./group";
import calendarRouter from "./calendar";
import homeRouter from "./home";

export default function route(app) {
    app.use("/auth", authRouter);
    app.use("/users", userRouter);
    app.use("/booking", bookingRouter);
    app.use("/groups", groupRouter);
    app.use("/calendars", calendarRouter);
    app.use("/statistics", homeRouter)
}
