"""Worker process: scheduled collection and refresh (tasks B6, B7). Same image as the API."""
import logging
import time

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("worker")

POLL_SECONDS = 30


def main() -> None:
    log.info("worker started")
    while True:
        # TODO B7: pick queued collect runs, run collectors, refresh stale cards, write status history.
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
