package wire

import (
	"github.com/google/wire"
	"github.com/tnngo/bolt-ui/application"
)

//lint:ignore U1000 because
var appSet = wire.NewSet(
	wire.Struct(new(application.Application), "*"),
	application.NewBrowseHandler,
)
