package main

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
)

func main() {
	fmt.Println("Iniciando UpzLab Go API Gateway...")

	// URL do servidor Python (ajuste se estiver em outra porta)
	targetURL, err := url.Parse("http://localhost:8000")
	if err != nil {
		panic(err)
	}

	// Criando o Proxy Reverso
	proxy := httputil.NewSingleHostReverseProxy(targetURL)

	// Interceptando todas as requisições e enviando para o Python
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("[Proxy] Encaminhando requisição: %s %s\n", r.Method, r.URL.Path)

		proxy.ServeHTTP(w, r)
	})

	port := ":8081"
	fmt.Printf("API Gateway (Go) rodando na porta %s -> Direcionando para %s\n", port, targetURL.String())

	if err := http.ListenAndServe(port, nil); err != nil {
		fmt.Printf("Erro ao iniciar o servidor Go: %v\n", err)
	}
}
