package adapters

import (
	"github.com/boreq/errors"
	"github.com/tnngo/bolt-ui/application"
	bolt "go.etcd.io/bbolt"
)

type AdaptersProvider interface {
	Provide(tx *bolt.Tx) (*application.TransactableAdapters, error)
}

type TransactionProvider struct {
	db       *bolt.DB
	provider AdaptersProvider
}

func NewTransactionProvider(
	db *bolt.DB,
	provider AdaptersProvider,
) *TransactionProvider {
	return &TransactionProvider{
		db:       db,
		provider: provider,
	}
}

func (p *TransactionProvider) Read(handler application.TransactionHandler) error {
	return p.db.View(func(tx *bolt.Tx) error {
		adapters, err := p.provider.Provide(tx)
		if err != nil {
			return errors.Wrap(err, "could not provide the adapters")
		}
		return handler(adapters)
	})
}

func (p *TransactionProvider) Write(handler application.TransactionHandler) error {
	return p.db.Update(func(tx *bolt.Tx) error {
		adapters, err := p.provider.Provide(tx)
		if err != nil {
			return errors.Wrap(err, "could not provide the adapters")
		}
		return handler(adapters)
	})
}
