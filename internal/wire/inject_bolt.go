package wire

import (
	"github.com/google/wire"
	"github.com/tnngo/bolt-ui/adapters"
	"github.com/tnngo/bolt-ui/internal/config"
	bolt "go.etcd.io/bbolt"
)

//lint:ignore U1000 because
var boltSet = wire.NewSet(
	newBolt,
)

func newBolt(conf *config.Config) (*bolt.DB, error) {
	return adapters.NewBolt(conf.DatabaseFile)
}
