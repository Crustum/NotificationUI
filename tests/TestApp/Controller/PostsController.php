<?php
declare(strict_types=1);

namespace TestApp\Controller;

use Cake\Controller\Controller;
use Cake\Event\EventInterface;

/**
 * Posts Controller
 *
 * @property \TestApp\Model\Table\PostsTable $Posts
 */
class PostsController extends Controller
{
    /**
     * Before filter callback
     *
     * @param \Cake\Event\EventInterface $event Event
     * @return \Cake\Http\Response|null|void
     */
    public function beforeFilter(EventInterface $event)
    {
        parent::beforeFilter($event);
    }

    /**
     * Publish action - publishes a post and triggers notification
     *
     * @param int $id Post ID
     * @return \Cake\Http\Response|null
     */
    public function publish(int $id)
    {
        $this->request->allowMethod(['post', 'put']);

        $post = $this->Posts->get($id);
        $post->published = true;

        if ($this->Posts->save($post)) {
            $this->Flash->success('Post published and notification sent.');

            return $this->redirect(['action' => 'view', $id]);
        }

        $this->Flash->error('Failed to publish post.');

        return $this->redirect(['action' => 'view', $id]);
    }
}
