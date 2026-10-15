package main

import (
	"context"
	"fmt"
	clientpkg "github.com/skibid991/shrink.site/sdk/go"
	"log"
)

func must(err error) {
	if err != nil {
		log.Fatal(err)
	}
}
func main() {
	ctx := context.Background()
	client := clientpkg.New()
	r, err := client.Shorten(ctx, "https://example.com/a/long/path", map[string]any{"expires_in": 300})
	must(err)
	var link struct {
		ID    string `json:"id"`
		URL   string `json:"url"`
		Token string `json:"delete_token"`
	}
	must(r.JSON(&link))
	defer func() { must(client.Delete(ctx, link.ID, link.Token)) }()
	fmt.Println(link.URL)
}
