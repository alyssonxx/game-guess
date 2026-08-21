# Game Guess V19.1 - servidor oficial EmulatorJS-Netplay
# O código do servidor é obtido diretamente do repositório oficial durante o build.
FROM rust:bookworm AS builder
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /build
RUN git clone --depth 1 --branch rust https://github.com/EmulatorJS/EmulatorJS-Netplay.git app
WORKDIR /build/app
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /build/app/target/release/rust-socket-server /usr/local/bin/emulatorjs-netplay
ENV PORT=10000
EXPOSE 10000
CMD ["/usr/local/bin/emulatorjs-netplay"]
