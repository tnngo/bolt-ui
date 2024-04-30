package wire

import (
	"net/http"

	"github.com/google/wire"
	httpPort "github.com/tnngo/bolt-ui/ports/http"
)

//lint:ignore U1000 because
var httpSet = wire.NewSet(
	httpPort.NewServer,
	httpPort.NewHandler,
	httpPort.NewTokenAuthProvider,
	wire.Bind(new(http.Handler), new(*httpPort.Handler)),
	wire.Bind(new(httpPort.AuthProvider), new(*httpPort.TokenAuthProvider)),
)
