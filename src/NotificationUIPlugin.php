<?php
declare(strict_types=1);

namespace Crustum\NotificationUI;

use Cake\Core\BasePlugin;
use Cake\Routing\RouteBuilder;

/**
 * Plugin for Notification UI
 */
class NotificationUIPlugin extends BasePlugin
{
    /**
     * Add routes for the plugin
     *
     * @param \Cake\Routing\RouteBuilder $routes The route builder to update
     * @return void
     */
    public function routes(RouteBuilder $routes): void
    {
        $routes->plugin('Crustum/NotificationUI', ['path' => '/notification'], function (RouteBuilder $builder): void {
            $builder->setExtensions(['json']);

            $builder->get('/notifications', ['controller' => 'Notifications', 'action' => 'index']);

            $builder->get('/notifications/unread', ['controller' => 'Notifications', 'action' => 'unread']);

            $builder->patch('/notifications/mark-all-read', ['controller' => 'Notifications', 'action' => 'markAllAsRead']);

            $builder->delete('/notifications', ['controller' => 'Notifications', 'action' => 'deleteAll']);

            $builder->get('/notifications/{id}', ['controller' => 'Notifications', 'action' => 'view'])
                ->setPass(['id']);

            $builder->patch('/notifications/{id}/read', ['controller' => 'Notifications', 'action' => 'markAsRead'])
                ->setPass(['id']);

            $builder->delete('/notifications/{id}', ['controller' => 'Notifications', 'action' => 'delete'])
                ->setPass(['id']);
        });

        parent::routes($routes);
    }
}
