(module
  (memory $memory (;0;) (export "memory") 1 4096)
  (global $arena_start (;0;) i32 (i32.const 1024))
  (global $heap (;1;) (mut i32) (i32.const 1024))
  (func $sfm_reset_arena (;0;) (export "sfm_reset_arena")
    global.get $arena_start
    global.set $heap
  )
  (func $sfm_alloc (;1;) (export "sfm_alloc") (param $bytes (;0;) i32) (param $align (;1;) i32) (result i32)
    (local $mask i32)
    (local $ptr i32)
    (local $new_heap i32)
    (local $current_pages i32)
    (local $needed_pages i32)
    (local $grow_pages i32)
    local.get $align
    i32.const 1
    i32.sub
    local.set $mask
    global.get $heap
    local.get $mask
    i32.add
    local.get $mask
    i32.const -1
    i32.xor
    i32.and
    local.tee $ptr
    local.get $bytes
    i32.add
    local.tee $new_heap
    global.set $heap
    local.get $new_heap
    memory.size
    i32.const 16
    i32.shl
    i32.gt_u
    if
      memory.size
      local.set $current_pages
      local.get $new_heap
      i32.const 65535
      i32.add
      i32.const 16
      i32.shr_u
      local.set $needed_pages
      local.get $needed_pages
      local.get $current_pages
      i32.sub
      local.set $grow_pages
      local.get $grow_pages
      memory.grow
      drop
    end
    local.get $ptr
  )
  (func $sfm_make_pixel_tiles4_f32 (;2;) (export "sfm_make_pixel_tiles4_f32") (param $points_ptr (;0;) i32) (param $match_count (;1;) i32) (param $out_tiles_ptr (;2;) i32) (result i32)
    (local $tile_count i32)
    (local $tile i32)
    (local $lane i32)
    (local $idx i32)
    (local $src i32)
    (local $dst i32)
    local.get $match_count
    i32.const 3
    i32.add
    i32.const 2
    i32.shr_u
    local.set $tile_count
    i32.const 0
    local.set $tile
    block $label0
      loop $label3
        local.get $tile
        local.get $tile_count
        i32.ge_u
        br_if $label0
        i32.const 0
        local.set $lane
        block $label1
          loop $label2
            local.get $lane
            i32.const 4
            i32.ge_u
            br_if $label1
            local.get $tile
            i32.const 2
            i32.shl
            local.get $lane
            i32.add
            local.set $idx
            local.get $out_tiles_ptr
            local.get $tile
            i32.const 6
            i32.shl
            i32.add
            local.set $dst
            local.get $idx
            local.get $match_count
            i32.lt_u
            if
              local.get $points_ptr
              local.get $idx
              i32.const 4
              i32.shl
              i32.add
              local.set $src
              local.get $dst
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              local.get $src
              f32.load
              f32.store
              local.get $dst
              i32.const 16
              i32.add
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              local.get $src
              i32.const 4
              i32.add
              f32.load
              f32.store
              local.get $dst
              i32.const 32
              i32.add
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              local.get $src
              i32.const 8
              i32.add
              f32.load
              f32.store
              local.get $dst
              i32.const 48
              i32.add
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              local.get $src
              i32.const 12
              i32.add
              f32.load
              f32.store
            else
              local.get $dst
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              f32.const 0.0
              f32.store
              local.get $dst
              i32.const 16
              i32.add
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              f32.const 0.0
              f32.store
              local.get $dst
              i32.const 32
              i32.add
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              f32.const 0.0
              f32.store
              local.get $dst
              i32.const 48
              i32.add
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              f32.const 0.0
              f32.store
            end
            local.get $lane
            i32.const 1
            i32.add
            local.set $lane
            br $label2
          end $label2
        end $label1
        local.get $tile
        i32.const 1
        i32.add
        local.set $tile
        br $label3
      end $label3
    end $label0
    local.get $tile_count
  )
  (func $sfm_score_fundamental_batch_f32 (;3;) (export "sfm_score_fundamental_batch_f32") (param $tiles_ptr (;0;) i32) (param $match_count (;1;) i32) (param $f_mats_ptr (;2;) i32) (param $hypothesis_count (;3;) i32) (param $threshold_sq (;4;) f32) (param $out_counts_ptr (;5;) i32) (param $out_errors_ptr (;6;) i32) (result i32)
    (local $tile_count i32)
    (local $h i32)
    (local $tile i32)
    (local $tile_ptr i32)
    (local $fbase i32)
    (local $count i32)
    (local $sum f32)
    (local $base_index i32)
    (local $zero v128)
    (local $eps v128)
    (local $threshold v128)
    (local $sumv v128)
    (local $f00 v128)
    (local $f01 v128)
    (local $f02 v128)
    (local $f10 v128)
    (local $f11 v128)
    (local $f12 v128)
    (local $f20 v128)
    (local $f21 v128)
    (local $f22 v128)
    (local $x1 v128)
    (local $y1 v128)
    (local $x2 v128)
    (local $y2 v128)
    (local $fx0 v128)
    (local $fx1 v128)
    (local $fx2 v128)
    (local $ftx0 v128)
    (local $ftx1 v128)
    (local $num v128)
    (local $den v128)
    (local $err v128)
    (local $valid v128)
    (local $positive v128)
    (local $inlier v128)
    local.get $match_count
    i32.const 3
    i32.add
    i32.const 2
    i32.shr_u
    local.set $tile_count
    f32.const 0.0
    f32x4.splat
    local.set $zero
    f32.const 9.99999996e-13
    f32x4.splat
    local.set $eps
    local.get $threshold_sq
    f32x4.splat
    local.set $threshold
    i32.const 0
    local.set $h
    block $label0
      loop $label3
        local.get $h
        local.get $hypothesis_count
        i32.ge_u
        br_if $label0
        local.get $f_mats_ptr
        local.get $h
        i32.const 48
        i32.mul
        i32.add
        local.set $fbase
        local.get $fbase
        f32.load
        f32x4.splat
        local.set $f00
        local.get $fbase
        i32.const 4
        i32.add
        f32.load
        f32x4.splat
        local.set $f01
        local.get $fbase
        i32.const 8
        i32.add
        f32.load
        f32x4.splat
        local.set $f02
        local.get $fbase
        i32.const 16
        i32.add
        f32.load
        f32x4.splat
        local.set $f10
        local.get $fbase
        i32.const 20
        i32.add
        f32.load
        f32x4.splat
        local.set $f11
        local.get $fbase
        i32.const 24
        i32.add
        f32.load
        f32x4.splat
        local.set $f12
        local.get $fbase
        i32.const 32
        i32.add
        f32.load
        f32x4.splat
        local.set $f20
        local.get $fbase
        i32.const 36
        i32.add
        f32.load
        f32x4.splat
        local.set $f21
        local.get $fbase
        i32.const 40
        i32.add
        f32.load
        f32x4.splat
        local.set $f22
        i32.const 0
        local.set $count
        local.get $zero
        local.set $sumv
        i32.const 0
        local.set $tile
        block $label1
          loop $label2
            local.get $tile
            local.get $tile_count
            i32.ge_u
            br_if $label1
            local.get $tiles_ptr
            local.get $tile
            i32.const 6
            i32.shl
            i32.add
            local.set $tile_ptr
            local.get $tile_ptr
            v128.load
            local.set $x1
            local.get $tile_ptr
            v128.load offset=16
            local.set $y1
            local.get $tile_ptr
            v128.load offset=32
            local.set $x2
            local.get $tile_ptr
            v128.load offset=48
            local.set $y2
            local.get $tile
            i32.const 2
            i32.shl
            local.set $base_index
            local.get $base_index
            i32x4.splat
            v128.const i32x4 0x00000000 0x00000001 0x00000002 0x00000003
            i32x4.add
            local.get $match_count
            i32x4.splat
            i32x4.lt_u
            local.set $valid
            local.get $f00
            local.get $x1
            f32x4.mul
            local.get $f01
            local.get $y1
            f32x4.mul
            f32x4.add
            local.get $f02
            f32x4.add
            local.set $fx0
            local.get $f10
            local.get $x1
            f32x4.mul
            local.get $f11
            local.get $y1
            f32x4.mul
            f32x4.add
            local.get $f12
            f32x4.add
            local.set $fx1
            local.get $f20
            local.get $x1
            f32x4.mul
            local.get $f21
            local.get $y1
            f32x4.mul
            f32x4.add
            local.get $f22
            f32x4.add
            local.set $fx2
            local.get $f00
            local.get $x2
            f32x4.mul
            local.get $f10
            local.get $y2
            f32x4.mul
            f32x4.add
            local.get $f20
            f32x4.add
            local.set $ftx0
            local.get $f01
            local.get $x2
            f32x4.mul
            local.get $f11
            local.get $y2
            f32x4.mul
            f32x4.add
            local.get $f21
            f32x4.add
            local.set $ftx1
            local.get $x2
            local.get $fx0
            f32x4.mul
            local.get $y2
            local.get $fx1
            f32x4.mul
            f32x4.add
            local.get $fx2
            f32x4.add
            local.set $num
            local.get $fx0
            local.get $fx0
            f32x4.mul
            local.get $fx1
            local.get $fx1
            f32x4.mul
            f32x4.add
            local.get $ftx0
            local.get $ftx0
            f32x4.mul
            local.get $ftx1
            local.get $ftx1
            f32x4.mul
            f32x4.add
            f32x4.add
            local.set $den
            local.get $num
            local.get $num
            f32x4.mul
            local.get $den
            f32x4.div
            local.set $err
            local.get $den
            local.get $eps
            f32x4.gt
            local.set $positive
            local.get $valid
            local.get $positive
            v128.and
            local.get $err
            local.get $threshold
            f32x4.le
            v128.and
            local.set $inlier
            local.get $count
            local.get $inlier
            i32x4.bitmask
            i32.popcnt
            i32.add
            local.set $count
            local.get $sumv
            local.get $err
            local.get $zero
            local.get $inlier
            v128.bitselect
            f32x4.add
            local.set $sumv
            local.get $tile
            i32.const 1
            i32.add
            local.set $tile
            br $label2
          end $label2
        end $label1
        local.get $sumv
        f32x4.extract_lane 0
        local.get $sumv
        f32x4.extract_lane 1
        f32.add
        local.get $sumv
        f32x4.extract_lane 2
        local.get $sumv
        f32x4.extract_lane 3
        f32.add
        f32.add
        local.set $sum
        local.get $out_counts_ptr
        local.get $h
        i32.const 2
        i32.shl
        i32.add
        local.get $count
        i32.store
        local.get $out_errors_ptr
        local.get $h
        i32.const 2
        i32.shl
        i32.add
        local.get $sum
        f32.store
        local.get $h
        i32.const 1
        i32.add
        local.set $h
        br $label3
      end $label3
    end $label0
    local.get $hypothesis_count
  )
  (func $sfm_reduce_best_hypothesis (;4;) (export "sfm_reduce_best_hypothesis") (param $counts_ptr (;0;) i32) (param $errors_ptr (;1;) i32) (param $hypothesis_count (;2;) i32) (param $out_best_ptr (;3;) i32) (result i32)
    (local $h i32)
    (local $count i32)
    (local $best_count i32)
    (local $best_h i32)
    (local $err f32)
    (local $best_err f32)
    local.get $hypothesis_count
    i32.eqz
    if
      local.get $out_best_ptr
      i32.const -1
      i32.store
      local.get $out_best_ptr
      i32.const 4
      i32.add
      i32.const 0
      i32.store
      local.get $out_best_ptr
      i32.const 8
      i32.add
      f32.const 3.40282306e+38
      f32.store
      i32.const -1
      return
    end
    i32.const 0
    local.set $h
    i32.const 0
    local.set $best_count
    i32.const -1
    local.set $best_h
    f32.const 3.40282306e+38
    local.set $best_err
    block $label0
      loop $label1
        local.get $h
        local.get $hypothesis_count
        i32.ge_u
        br_if $label0
        local.get $counts_ptr
        local.get $h
        i32.const 2
        i32.shl
        i32.add
        i32.load
        local.set $count
        local.get $errors_ptr
        local.get $h
        i32.const 2
        i32.shl
        i32.add
        f32.load
        local.set $err
        local.get $count
        local.get $best_count
        i32.gt_u
        if
          local.get $count
          local.set $best_count
          local.get $h
          local.set $best_h
          local.get $err
          local.set $best_err
        else
          local.get $count
          local.get $best_count
          i32.eq
          if
            local.get $err
            local.get $best_err
            f32.lt
            if
              local.get $h
              local.set $best_h
              local.get $err
              local.set $best_err
            end
          end
        end
        local.get $h
        i32.const 1
        i32.add
        local.set $h
        br $label1
      end $label1
    end $label0
    local.get $out_best_ptr
    local.get $best_h
    i32.store
    local.get $out_best_ptr
    i32.const 4
    i32.add
    local.get $best_count
    i32.store
    local.get $out_best_ptr
    i32.const 8
    i32.add
    local.get $best_err
    f32.store
    local.get $best_h
  )
  (func $sfm_make_pnp_tiles4_f32 (;5;) (export "sfm_make_pnp_tiles4_f32") (param $obs_ptr (;0;) i32) (param $obs_count (;1;) i32) (param $out_tiles_ptr (;2;) i32) (result i32)
    (local $tile_count i32)
    (local $tile i32)
    (local $lane i32)
    (local $idx i32)
    (local $src i32)
    (local $dst i32)
    local.get $obs_count
    i32.const 3
    i32.add
    i32.const 2
    i32.shr_u
    local.set $tile_count
    i32.const 0
    local.set $tile
    block $label0
      loop $label3
        local.get $tile
        local.get $tile_count
        i32.ge_u
        br_if $label0
        i32.const 0
        local.set $lane
        block $label1
          loop $label2
            local.get $lane
            i32.const 4
            i32.ge_u
            br_if $label1
            local.get $tile
            i32.const 2
            i32.shl
            local.get $lane
            i32.add
            local.set $idx
            local.get $out_tiles_ptr
            local.get $tile
            i32.const 80
            i32.mul
            i32.add
            local.set $dst
            local.get $idx
            local.get $obs_count
            i32.lt_u
            if
              local.get $obs_ptr
              local.get $idx
              i32.const 20
              i32.mul
              i32.add
              local.set $src
              local.get $dst
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              local.get $src
              f32.load
              f32.store
              local.get $dst
              i32.const 16
              i32.add
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              local.get $src
              i32.const 4
              i32.add
              f32.load
              f32.store
              local.get $dst
              i32.const 32
              i32.add
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              local.get $src
              i32.const 8
              i32.add
              f32.load
              f32.store
              local.get $dst
              i32.const 48
              i32.add
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              local.get $src
              i32.const 12
              i32.add
              f32.load
              f32.store
              local.get $dst
              i32.const 64
              i32.add
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              local.get $src
              i32.const 16
              i32.add
              f32.load
              f32.store
            else
              local.get $dst
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              f32.const 0.0
              f32.store
              local.get $dst
              i32.const 16
              i32.add
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              f32.const 0.0
              f32.store
              local.get $dst
              i32.const 32
              i32.add
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              f32.const 0.0
              f32.store
              local.get $dst
              i32.const 48
              i32.add
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              f32.const 0.0
              f32.store
              local.get $dst
              i32.const 64
              i32.add
              local.get $lane
              i32.const 2
              i32.shl
              i32.add
              f32.const 0.0
              f32.store
            end
            local.get $lane
            i32.const 1
            i32.add
            local.set $lane
            br $label2
          end $label2
        end $label1
        local.get $tile
        i32.const 1
        i32.add
        local.set $tile
        br $label3
      end $label3
    end $label0
    local.get $tile_count
  )
  (func $sfm_score_pnp_pose_f32 (;6;) (export "sfm_score_pnp_pose_f32") (param $tiles_ptr (;0;) i32) (param $obs_count (;1;) i32) (param $intrinsics_ptr (;2;) i32) (param $pose_ptr (;3;) i32) (param $threshold_sq (;4;) f32) (param $out_inliers_ptr (;5;) i32) (param $out_errors_ptr (;6;) i32) (param $out_summary_ptr (;7;) i32) (result i32)
    (local $tile_count i32)
    (local $tile i32)
    (local $tile_ptr i32)
    (local $base_index i32)
    (local $count i32)
    (local $mask_bits i32)
    (local $idx i32)
    (local $sum f32)
    (local $zero v128)
    (local $one v128)
    (local $eps v128)
    (local $inf v128)
    (local $threshold v128)
    (local $sumv v128)
    (local $fx v128)
    (local $fy v128)
    (local $cx0 v128)
    (local $cy0 v128)
    (local $k1 v128)
    (local $k2 v128)
    (local $p1 v128)
    (local $p2 v128)
    (local $r00 v128)
    (local $r01 v128)
    (local $r02 v128)
    (local $r10 v128)
    (local $r11 v128)
    (local $r12 v128)
    (local $r20 v128)
    (local $r21 v128)
    (local $r22 v128)
    (local $tx v128)
    (local $ty v128)
    (local $tz v128)
    (local $X v128)
    (local $Y v128)
    (local $Z v128)
    (local $obs_u v128)
    (local $obs_v v128)
    (local $px v128)
    (local $py v128)
    (local $pz v128)
    (local $x v128)
    (local $y v128)
    (local $x2 v128)
    (local $y2 v128)
    (local $xy v128)
    (local $r2 v128)
    (local $radial v128)
    (local $xd v128)
    (local $yd v128)
    (local $u v128)
    (local $v v128)
    (local $du v128)
    (local $dv v128)
    (local $err v128)
    (local $err_out v128)
    (local $valid v128)
    (local $positive v128)
    (local $inlier v128)
    local.get $obs_count
    i32.const 3
    i32.add
    i32.const 2
    i32.shr_u
    local.set $tile_count
    f32.const 0.0
    f32x4.splat
    local.set $zero
    f32.const 1
    f32x4.splat
    local.set $one
    f32.const 9.99999997e-07
    f32x4.splat
    local.set $eps
    f32.const 3.40282306e+38
    f32x4.splat
    local.set $inf
    local.get $threshold_sq
    f32x4.splat
    local.set $threshold
    local.get $intrinsics_ptr
    f32.load
    f32x4.splat
    local.set $fx
    local.get $intrinsics_ptr
    i32.const 4
    i32.add
    f32.load
    f32x4.splat
    local.set $fy
    local.get $intrinsics_ptr
    i32.const 8
    i32.add
    f32.load
    f32x4.splat
    local.set $cx0
    local.get $intrinsics_ptr
    i32.const 12
    i32.add
    f32.load
    f32x4.splat
    local.set $cy0
    local.get $intrinsics_ptr
    i32.const 16
    i32.add
    f32.load
    f32x4.splat
    local.set $k1
    local.get $intrinsics_ptr
    i32.const 20
    i32.add
    f32.load
    f32x4.splat
    local.set $k2
    local.get $intrinsics_ptr
    i32.const 24
    i32.add
    f32.load
    f32x4.splat
    local.set $p1
    local.get $intrinsics_ptr
    i32.const 28
    i32.add
    f32.load
    f32x4.splat
    local.set $p2
    local.get $pose_ptr
    f32.load
    f32x4.splat
    local.set $r00
    local.get $pose_ptr
    i32.const 4
    i32.add
    f32.load
    f32x4.splat
    local.set $r01
    local.get $pose_ptr
    i32.const 8
    i32.add
    f32.load
    f32x4.splat
    local.set $r02
    local.get $pose_ptr
    i32.const 12
    i32.add
    f32.load
    f32x4.splat
    local.set $r10
    local.get $pose_ptr
    i32.const 16
    i32.add
    f32.load
    f32x4.splat
    local.set $r11
    local.get $pose_ptr
    i32.const 20
    i32.add
    f32.load
    f32x4.splat
    local.set $r12
    local.get $pose_ptr
    i32.const 24
    i32.add
    f32.load
    f32x4.splat
    local.set $r20
    local.get $pose_ptr
    i32.const 28
    i32.add
    f32.load
    f32x4.splat
    local.set $r21
    local.get $pose_ptr
    i32.const 32
    i32.add
    f32.load
    f32x4.splat
    local.set $r22
    local.get $pose_ptr
    i32.const 36
    i32.add
    f32.load
    f32x4.splat
    local.set $tx
    local.get $pose_ptr
    i32.const 40
    i32.add
    f32.load
    f32x4.splat
    local.set $ty
    local.get $pose_ptr
    i32.const 44
    i32.add
    f32.load
    f32x4.splat
    local.set $tz
    i32.const 0
    local.set $count
    local.get $zero
    local.set $sumv
    i32.const 0
    local.set $tile
    block $label0
      loop $label1
        local.get $tile
        local.get $tile_count
        i32.ge_u
        br_if $label0
        local.get $tiles_ptr
        local.get $tile
        i32.const 80
        i32.mul
        i32.add
        local.set $tile_ptr
        local.get $tile_ptr
        v128.load
        local.set $X
        local.get $tile_ptr
        v128.load offset=16
        local.set $Y
        local.get $tile_ptr
        v128.load offset=32
        local.set $Z
        local.get $tile_ptr
        v128.load offset=48
        local.set $obs_u
        local.get $tile_ptr
        v128.load offset=64
        local.set $obs_v
        local.get $tile
        i32.const 2
        i32.shl
        local.set $base_index
        local.get $base_index
        i32x4.splat
        v128.const i32x4 0x00000000 0x00000001 0x00000002 0x00000003
        i32x4.add
        local.get $obs_count
        i32x4.splat
        i32x4.lt_u
        local.set $valid
        local.get $r00
        local.get $X
        f32x4.mul
        local.get $r01
        local.get $Y
        f32x4.mul
        f32x4.add
        local.get $r02
        local.get $Z
        f32x4.mul
        f32x4.add
        local.get $tx
        f32x4.add
        local.set $px
        local.get $r10
        local.get $X
        f32x4.mul
        local.get $r11
        local.get $Y
        f32x4.mul
        f32x4.add
        local.get $r12
        local.get $Z
        f32x4.mul
        f32x4.add
        local.get $ty
        f32x4.add
        local.set $py
        local.get $r20
        local.get $X
        f32x4.mul
        local.get $r21
        local.get $Y
        f32x4.mul
        f32x4.add
        local.get $r22
        local.get $Z
        f32x4.mul
        f32x4.add
        local.get $tz
        f32x4.add
        local.set $pz
        local.get $valid
        local.get $pz
        local.get $eps
        f32x4.gt
        v128.and
        local.set $positive
        local.get $px
        local.get $pz
        f32x4.div
        local.set $x
        local.get $py
        local.get $pz
        f32x4.div
        local.set $y
        local.get $x
        local.get $x
        f32x4.mul
        local.set $x2
        local.get $y
        local.get $y
        f32x4.mul
        local.set $y2
        local.get $x
        local.get $y
        f32x4.mul
        local.set $xy
        local.get $x2
        local.get $y2
        f32x4.add
        local.set $r2
        local.get $one
        local.get $k1
        local.get $r2
        f32x4.mul
        f32x4.add
        local.get $k2
        local.get $r2
        f32x4.mul
        local.get $r2
        f32x4.mul
        f32x4.add
        local.set $radial
        local.get $x
        local.get $radial
        f32x4.mul
        local.get $p1
        local.get $xy
        f32x4.mul
        f32.const 2
        f32x4.splat
        f32x4.mul
        f32x4.add
        local.get $p2
        local.get $r2
        local.get $x2
        f32.const 2
        f32x4.splat
        f32x4.mul
        f32x4.add
        f32x4.mul
        f32x4.add
        local.set $xd
        local.get $y
        local.get $radial
        f32x4.mul
        local.get $p1
        local.get $r2
        local.get $y2
        f32.const 2
        f32x4.splat
        f32x4.mul
        f32x4.add
        f32x4.mul
        f32x4.add
        local.get $p2
        local.get $xy
        f32x4.mul
        f32.const 2
        f32x4.splat
        f32x4.mul
        f32x4.add
        local.set $yd
        local.get $fx
        local.get $xd
        f32x4.mul
        local.get $cx0
        f32x4.add
        local.set $u
        local.get $fy
        local.get $yd
        f32x4.mul
        local.get $cy0
        f32x4.add
        local.set $v
        local.get $u
        local.get $obs_u
        f32x4.sub
        local.set $du
        local.get $v
        local.get $obs_v
        f32x4.sub
        local.set $dv
        local.get $du
        local.get $du
        f32x4.mul
        local.get $dv
        local.get $dv
        f32x4.mul
        f32x4.add
        local.set $err
        local.get $positive
        local.get $err
        local.get $threshold
        f32x4.lt
        v128.and
        local.set $inlier
        local.get $err
        local.get $inf
        local.get $positive
        v128.bitselect
        local.set $err_out
        local.get $sumv
        local.get $err
        local.get $zero
        local.get $inlier
        v128.bitselect
        f32x4.add
        local.set $sumv
        local.get $inlier
        i32x4.bitmask
        local.set $mask_bits
        local.get $base_index
        local.set $idx
        local.get $idx
        local.get $obs_count
        i32.lt_u
        if
          local.get $out_errors_ptr
          local.get $idx
          i32.const 2
          i32.shl
          i32.add
          local.get $err_out
          f32x4.extract_lane 0
          f32.store
          local.get $mask_bits
          i32.const 1
          i32.and
          if
            local.get $out_inliers_ptr
            local.get $count
            i32.const 2
            i32.shl
            i32.add
            local.get $idx
            i32.store
            local.get $count
            i32.const 1
            i32.add
            local.set $count
          end
        end
        local.get $base_index
        i32.const 1
        i32.add
        local.set $idx
        local.get $idx
        local.get $obs_count
        i32.lt_u
        if
          local.get $out_errors_ptr
          local.get $idx
          i32.const 2
          i32.shl
          i32.add
          local.get $err_out
          f32x4.extract_lane 1
          f32.store
          local.get $mask_bits
          i32.const 2
          i32.and
          if
            local.get $out_inliers_ptr
            local.get $count
            i32.const 2
            i32.shl
            i32.add
            local.get $idx
            i32.store
            local.get $count
            i32.const 1
            i32.add
            local.set $count
          end
        end
        local.get $base_index
        i32.const 2
        i32.add
        local.set $idx
        local.get $idx
        local.get $obs_count
        i32.lt_u
        if
          local.get $out_errors_ptr
          local.get $idx
          i32.const 2
          i32.shl
          i32.add
          local.get $err_out
          f32x4.extract_lane 2
          f32.store
          local.get $mask_bits
          i32.const 4
          i32.and
          if
            local.get $out_inliers_ptr
            local.get $count
            i32.const 2
            i32.shl
            i32.add
            local.get $idx
            i32.store
            local.get $count
            i32.const 1
            i32.add
            local.set $count
          end
        end
        local.get $base_index
        i32.const 3
        i32.add
        local.set $idx
        local.get $idx
        local.get $obs_count
        i32.lt_u
        if
          local.get $out_errors_ptr
          local.get $idx
          i32.const 2
          i32.shl
          i32.add
          local.get $err_out
          f32x4.extract_lane 3
          f32.store
          local.get $mask_bits
          i32.const 8
          i32.and
          if
            local.get $out_inliers_ptr
            local.get $count
            i32.const 2
            i32.shl
            i32.add
            local.get $idx
            i32.store
            local.get $count
            i32.const 1
            i32.add
            local.set $count
          end
        end
        local.get $tile
        i32.const 1
        i32.add
        local.set $tile
        br $label1
      end $label1
    end $label0
    local.get $sumv
    f32x4.extract_lane 0
    local.get $sumv
    f32x4.extract_lane 1
    f32.add
    local.get $sumv
    f32x4.extract_lane 2
    local.get $sumv
    f32x4.extract_lane 3
    f32.add
    f32.add
    local.set $sum
    local.get $out_summary_ptr
    local.get $count
    i32.store
    local.get $out_summary_ptr
    i32.const 4
    i32.add
    local.get $sum
    f32.store
    local.get $count
  )
  (func $sfm_score_pnp_pose_batch_f32 (;7;) (export "sfm_score_pnp_pose_batch_f32") (param $tiles_ptr (;0;) i32) (param $obs_count (;1;) i32) (param $intrinsics_ptr (;2;) i32) (param $poses_ptr (;3;) i32) (param $pose_count (;4;) i32) (param $threshold_sq (;5;) f32) (param $scratch_inliers_ptr (;6;) i32) (param $scratch_errors_ptr (;7;) i32) (param $summary_ptr (;8;) i32) (param $out_scores_ptr (;9;) i32) (result i32)
    (local $i i32)
    (local $pose_ptr i32)
    (local $score_ptr i32)
    i32.const 0
    local.set $i
    block $label0
      loop $label1
        local.get $i
        local.get $pose_count
        i32.ge_u
        br_if $label0
        local.get $poses_ptr
        local.get $i
        i32.const 48
        i32.mul
        i32.add
        local.set $pose_ptr
        local.get $out_scores_ptr
        local.get $i
        i32.const 3
        i32.shl
        i32.add
        local.set $score_ptr
        local.get $tiles_ptr
        local.get $obs_count
        local.get $intrinsics_ptr
        local.get $pose_ptr
        local.get $threshold_sq
        local.get $scratch_inliers_ptr
        local.get $scratch_errors_ptr
        local.get $summary_ptr
        call $sfm_score_pnp_pose_f32
        drop
        local.get $score_ptr
        local.get $summary_ptr
        i32.load
        i32.store
        local.get $score_ptr
        i32.const 4
        i32.add
        local.get $summary_ptr
        i32.const 4
        i32.add
        f32.load
        f32.store
        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $label1
      end $label1
    end $label0
    local.get $pose_count
  )
  (func $sfm_bundle_reprojection_costs_f64 (;8;) (export "sfm_bundle_reprojection_costs_f64") (param $points_ptr (;0;) i32) (param $poses_ptr (;1;) i32) (param $intrinsics_ptr (;2;) i32) (param $obs_indices_ptr (;3;) i32) (param $measurements_ptr (;4;) i32) (param $obs_count (;5;) i32) (param $huber_delta (;6;) f64) (param $out_summary_ptr (;7;) i32) (result i32)
    (local $i i32)
    (local $count i32)
    (local $point_idx i32)
    (local $pose_idx i32)
    (local $point_ptr i32)
    (local $pose_ptr i32)
    (local $intrinsics_i_ptr i32)
    (local $measurement_ptr i32)
    (local $xw f64)
    (local $yw f64)
    (local $zw f64)
    (local $xc0 f64)
    (local $xc1 f64)
    (local $xc2 f64)
    (local $x f64)
    (local $y f64)
    (local $r2 f64)
    (local $r4 f64)
    (local $radial f64)
    (local $xd f64)
    (local $yd f64)
    (local $u f64)
    (local $v f64)
    (local $du f64)
    (local $dv f64)
    (local $err f64)
    (local $delta f64)
    (local $delta_sq f64)
    (local $l2_sum f64)
    (local $huber_sum f64)
    f64.const 0.000001
    local.set $delta
    local.get $huber_delta
    local.get $huber_delta
    f64.eq
    if
      local.get $huber_delta
      f64.const 0.000001
      f64.gt
      if
        local.get $huber_delta
        local.set $delta
      end
    end
    local.get $delta
    local.get $delta
    f64.mul
    local.set $delta_sq
    i32.const 0
    local.set $i
    i32.const 0
    local.set $count
    f64.const 0.0
    local.set $l2_sum
    f64.const 0.0
    local.set $huber_sum
    block $label0
      loop $label1
        local.get $i
        local.get $obs_count
        i32.ge_u
        br_if $label0
        local.get $obs_indices_ptr
        local.get $i
        i32.const 3
        i32.shl
        i32.add
        i32.load
        local.set $point_idx
        local.get $obs_indices_ptr
        local.get $i
        i32.const 3
        i32.shl
        i32.add
        i32.const 4
        i32.add
        i32.load
        local.set $pose_idx
        local.get $points_ptr
        local.get $point_idx
        i32.const 24
        i32.mul
        i32.add
        local.set $point_ptr
        local.get $poses_ptr
        local.get $pose_idx
        i32.const 96
        i32.mul
        i32.add
        local.set $pose_ptr
        local.get $intrinsics_ptr
        local.get $pose_idx
        i32.const 64
        i32.mul
        i32.add
        local.set $intrinsics_i_ptr
        local.get $measurements_ptr
        local.get $i
        i32.const 4
        i32.shl
        i32.add
        local.set $measurement_ptr
        local.get $point_ptr
        f64.load
        local.set $xw
        local.get $point_ptr
        i32.const 8
        i32.add
        f64.load
        local.set $yw
        local.get $point_ptr
        i32.const 16
        i32.add
        f64.load
        local.set $zw
        local.get $pose_ptr
        f64.load
        local.get $xw
        f64.mul
        local.get $pose_ptr
        i32.const 8
        i32.add
        f64.load
        local.get $yw
        f64.mul
        f64.add
        local.get $pose_ptr
        i32.const 16
        i32.add
        f64.load
        local.get $zw
        f64.mul
        f64.add
        local.get $pose_ptr
        i32.const 72
        i32.add
        f64.load
        f64.add
        local.set $xc0
        local.get $pose_ptr
        i32.const 24
        i32.add
        f64.load
        local.get $xw
        f64.mul
        local.get $pose_ptr
        i32.const 32
        i32.add
        f64.load
        local.get $yw
        f64.mul
        f64.add
        local.get $pose_ptr
        i32.const 40
        i32.add
        f64.load
        local.get $zw
        f64.mul
        f64.add
        local.get $pose_ptr
        i32.const 80
        i32.add
        f64.load
        f64.add
        local.set $xc1
        local.get $pose_ptr
        i32.const 48
        i32.add
        f64.load
        local.get $xw
        f64.mul
        local.get $pose_ptr
        i32.const 56
        i32.add
        f64.load
        local.get $yw
        f64.mul
        f64.add
        local.get $pose_ptr
        i32.const 64
        i32.add
        f64.load
        local.get $zw
        f64.mul
        f64.add
        local.get $pose_ptr
        i32.const 88
        i32.add
        f64.load
        f64.add
        local.set $xc2
        local.get $xc2
        f64.const 0.000001
        f64.gt
        if
          local.get $xc0
          local.get $xc2
          f64.div
          local.set $x
          local.get $xc1
          local.get $xc2
          f64.div
          local.set $y
          local.get $x
          local.get $x
          f64.mul
          local.get $y
          local.get $y
          f64.mul
          f64.add
          local.set $r2
          local.get $r2
          local.get $r2
          f64.mul
          local.set $r4
          f64.const 1
          local.get $intrinsics_i_ptr
          i32.const 32
          i32.add
          f64.load
          local.get $r2
          f64.mul
          f64.add
          local.get $intrinsics_i_ptr
          i32.const 40
          i32.add
          f64.load
          local.get $r4
          f64.mul
          f64.add
          local.set $radial
          local.get $x
          local.get $radial
          f64.mul
          f64.const 2
          local.get $intrinsics_i_ptr
          i32.const 48
          i32.add
          f64.load
          f64.mul
          local.get $x
          f64.mul
          local.get $y
          f64.mul
          f64.add
          local.get $intrinsics_i_ptr
          i32.const 56
          i32.add
          f64.load
          local.get $r2
          f64.const 2
          local.get $x
          local.get $x
          f64.mul
          f64.mul
          f64.add
          f64.mul
          f64.add
          local.set $xd
          local.get $y
          local.get $radial
          f64.mul
          local.get $intrinsics_i_ptr
          i32.const 48
          i32.add
          f64.load
          local.get $r2
          f64.const 2
          local.get $y
          local.get $y
          f64.mul
          f64.mul
          f64.add
          f64.mul
          f64.add
          f64.const 2
          local.get $intrinsics_i_ptr
          i32.const 56
          i32.add
          f64.load
          f64.mul
          local.get $x
          f64.mul
          local.get $y
          f64.mul
          f64.add
          local.set $yd
          local.get $intrinsics_i_ptr
          f64.load
          local.get $xd
          f64.mul
          local.get $intrinsics_i_ptr
          i32.const 16
          i32.add
          f64.load
          f64.add
          local.set $u
          local.get $intrinsics_i_ptr
          i32.const 8
          i32.add
          f64.load
          local.get $yd
          f64.mul
          local.get $intrinsics_i_ptr
          i32.const 24
          i32.add
          f64.load
          f64.add
          local.set $v
          local.get $measurement_ptr
          f64.load
          local.get $u
          f64.sub
          local.set $du
          local.get $measurement_ptr
          i32.const 8
          i32.add
          f64.load
          local.get $v
          f64.sub
          local.set $dv
          local.get $du
          local.get $du
          f64.mul
          local.get $dv
          local.get $dv
          f64.mul
          f64.add
          local.set $err
          local.get $err
          local.get $err
          f64.eq
          local.get $err
          f64.const 1.7976931348623157e+308
          f64.lt
          i32.and
          if
            local.get $l2_sum
            local.get $err
            f64.add
            local.set $l2_sum
            local.get $huber_sum
            local.get $err
            local.get $delta_sq
            f64.le
            if (result f64)
              local.get $err
            else
              f64.const 2
              local.get $delta
              f64.mul
              local.get $err
              f64.sqrt
              f64.mul
              local.get $delta_sq
              f64.sub
            end
            f64.add
            local.set $huber_sum
            local.get $count
            i32.const 1
            i32.add
            local.set $count
          end
        end
        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $label1
      end $label1
    end $label0
    local.get $out_summary_ptr
    local.get $l2_sum
    f64.store
    local.get $out_summary_ptr
    i32.const 8
    i32.add
    local.get $huber_sum
    f64.store
    local.get $out_summary_ptr
    i32.const 16
    i32.add
    local.get $count
    f64.convert_i32_u
    f64.store
    local.get $count
  )
  (func $sfm_bundle_accumulate_normal_equations_f64 (;9;) (export "sfm_bundle_accumulate_normal_equations_f64") (param $points_ptr (;0;) i32) (param $poses_ptr (;1;) i32) (param $intrinsics_ptr (;2;) i32) (param $obs_indices_ptr (;3;) i32) (param $measurements_ptr (;4;) i32) (param $obs_count (;5;) i32) (param $huber_delta (;6;) f64) (param $scratch_ptr (;7;) i32) (param $out_u_ptr (;8;) i32) (param $out_bc_ptr (;9;) i32) (param $out_vp_ptr (;10;) i32) (param $out_bp_ptr (;11;) i32) (param $out_w_ptr (;12;) i32) (result i32)
    (local $i i32)
    (local $count i32)
    (local $point_idx i32)
    (local $pose_idx i32)
    (local $cam_opt i32)
    (local $w_index i32)
    (local $obs_ptr i32)
    (local $point_ptr i32)
    (local $pose_ptr i32)
    (local $intrinsics_i_ptr i32)
    (local $measurement_ptr i32)
    (local $dst_ptr i32)
    (local $row i32)
    (local $k i32)
    (local $j i32)
    (local $r i32)
    (local $c i32)
    (local $xw f64)
    (local $yw f64)
    (local $zw f64)
    (local $xc0 f64)
    (local $xc1 f64)
    (local $xc2 f64)
    (local $rx f64)
    (local $ry f64)
    (local $rz f64)
    (local $inv_z f64)
    (local $x f64)
    (local $y f64)
    (local $fx f64)
    (local $fy f64)
    (local $cx f64)
    (local $cy f64)
    (local $k1 f64)
    (local $k2 f64)
    (local $p1 f64)
    (local $p2 f64)
    (local $r2 f64)
    (local $r4 f64)
    (local $radial f64)
    (local $radial_dx f64)
    (local $radial_dy f64)
    (local $xd f64)
    (local $yd f64)
    (local $dxd_dx f64)
    (local $dxd_dy f64)
    (local $dyd_dx f64)
    (local $dyd_dy f64)
    (local $du_dx f64)
    (local $du_dy f64)
    (local $dv_dx f64)
    (local $dv_dy f64)
    (local $u f64)
    (local $v f64)
    (local $ru f64)
    (local $rv f64)
    (local $err f64)
    (local $rmag f64)
    (local $delta f64)
    (local $w f64)
    (local $wru f64)
    (local $wrv f64)
    (local $s f64)
    (local $j0r f64)
    (local $j1r f64)
    f64.const 0.000001
    local.set $delta
    local.get $huber_delta
    local.get $huber_delta
    f64.eq
    if
      local.get $huber_delta
      f64.const 0.000001
      f64.gt
      if
        local.get $huber_delta
        local.set $delta
      end
    end
    i32.const 0
    local.set $i
    i32.const 0
    local.set $count
    block $label0
      loop $label23
        local.get $i
        local.get $obs_count
        i32.ge_u
        br_if $label0
        local.get $obs_indices_ptr
        local.get $i
        i32.const 4
        i32.shl
        i32.add
        local.set $obs_ptr
        local.get $obs_ptr
        i32.load
        local.set $point_idx
        local.get $obs_ptr
        i32.const 4
        i32.add
        i32.load
        local.set $pose_idx
        local.get $obs_ptr
        i32.const 8
        i32.add
        i32.load
        local.set $cam_opt
        local.get $obs_ptr
        i32.const 12
        i32.add
        i32.load
        local.set $w_index
        local.get $points_ptr
        local.get $point_idx
        i32.const 24
        i32.mul
        i32.add
        local.set $point_ptr
        local.get $poses_ptr
        local.get $pose_idx
        i32.const 96
        i32.mul
        i32.add
        local.set $pose_ptr
        local.get $intrinsics_ptr
        local.get $pose_idx
        i32.const 64
        i32.mul
        i32.add
        local.set $intrinsics_i_ptr
        local.get $measurements_ptr
        local.get $i
        i32.const 4
        i32.shl
        i32.add
        local.set $measurement_ptr
        local.get $point_ptr
        f64.load
        local.set $xw
        local.get $point_ptr
        i32.const 8
        i32.add
        f64.load
        local.set $yw
        local.get $point_ptr
        i32.const 16
        i32.add
        f64.load
        local.set $zw
        local.get $pose_ptr
        f64.load
        local.get $xw
        f64.mul
        local.get $pose_ptr
        i32.const 8
        i32.add
        f64.load
        local.get $yw
        f64.mul
        f64.add
        local.get $pose_ptr
        i32.const 16
        i32.add
        f64.load
        local.get $zw
        f64.mul
        f64.add
        local.set $rx
        local.get $rx
        local.get $pose_ptr
        i32.const 72
        i32.add
        f64.load
        f64.add
        local.set $xc0
        local.get $pose_ptr
        i32.const 24
        i32.add
        f64.load
        local.get $xw
        f64.mul
        local.get $pose_ptr
        i32.const 32
        i32.add
        f64.load
        local.get $yw
        f64.mul
        f64.add
        local.get $pose_ptr
        i32.const 40
        i32.add
        f64.load
        local.get $zw
        f64.mul
        f64.add
        local.set $ry
        local.get $ry
        local.get $pose_ptr
        i32.const 80
        i32.add
        f64.load
        f64.add
        local.set $xc1
        local.get $pose_ptr
        i32.const 48
        i32.add
        f64.load
        local.get $xw
        f64.mul
        local.get $pose_ptr
        i32.const 56
        i32.add
        f64.load
        local.get $yw
        f64.mul
        f64.add
        local.get $pose_ptr
        i32.const 64
        i32.add
        f64.load
        local.get $zw
        f64.mul
        f64.add
        local.set $rz
        local.get $rz
        local.get $pose_ptr
        i32.const 88
        i32.add
        f64.load
        f64.add
        local.set $xc2
        local.get $xc2
        f64.const 0.000001
        f64.gt
        if
          f64.const 1
          local.get $xc2
          f64.div
          local.set $inv_z
          local.get $xc0
          local.get $inv_z
          f64.mul
          local.set $x
          local.get $xc1
          local.get $inv_z
          f64.mul
          local.set $y
          local.get $intrinsics_i_ptr
          f64.load
          local.set $fx
          local.get $intrinsics_i_ptr
          i32.const 8
          i32.add
          f64.load
          local.set $fy
          local.get $intrinsics_i_ptr
          i32.const 16
          i32.add
          f64.load
          local.set $cx
          local.get $intrinsics_i_ptr
          i32.const 24
          i32.add
          f64.load
          local.set $cy
          local.get $intrinsics_i_ptr
          i32.const 32
          i32.add
          f64.load
          local.set $k1
          local.get $intrinsics_i_ptr
          i32.const 40
          i32.add
          f64.load
          local.set $k2
          local.get $intrinsics_i_ptr
          i32.const 48
          i32.add
          f64.load
          local.set $p1
          local.get $intrinsics_i_ptr
          i32.const 56
          i32.add
          f64.load
          local.set $p2
          local.get $x
          local.get $x
          f64.mul
          local.get $y
          local.get $y
          f64.mul
          f64.add
          local.set $r2
          local.get $r2
          local.get $r2
          f64.mul
          local.set $r4
          f64.const 1
          local.get $k1
          local.get $r2
          f64.mul
          f64.add
          local.get $k2
          local.get $r4
          f64.mul
          f64.add
          local.set $radial
          f64.const 2
          local.get $k1
          f64.mul
          local.get $x
          f64.mul
          f64.const 4
          local.get $k2
          f64.mul
          local.get $x
          f64.mul
          local.get $r2
          f64.mul
          f64.add
          local.set $radial_dx
          f64.const 2
          local.get $k1
          f64.mul
          local.get $y
          f64.mul
          f64.const 4
          local.get $k2
          f64.mul
          local.get $y
          f64.mul
          local.get $r2
          f64.mul
          f64.add
          local.set $radial_dy
          local.get $x
          local.get $radial
          f64.mul
          f64.const 2
          local.get $p1
          f64.mul
          local.get $x
          f64.mul
          local.get $y
          f64.mul
          f64.add
          local.get $p2
          local.get $r2
          f64.const 2
          local.get $x
          local.get $x
          f64.mul
          f64.mul
          f64.add
          f64.mul
          f64.add
          local.set $xd
          local.get $y
          local.get $radial
          f64.mul
          local.get $p1
          local.get $r2
          f64.const 2
          local.get $y
          local.get $y
          f64.mul
          f64.mul
          f64.add
          f64.mul
          f64.add
          f64.const 2
          local.get $p2
          f64.mul
          local.get $x
          f64.mul
          local.get $y
          f64.mul
          f64.add
          local.set $yd
          local.get $radial
          local.get $x
          local.get $radial_dx
          f64.mul
          f64.add
          f64.const 2
          local.get $p1
          f64.mul
          local.get $y
          f64.mul
          f64.add
          f64.const 6
          local.get $p2
          f64.mul
          local.get $x
          f64.mul
          f64.add
          local.set $dxd_dx
          local.get $x
          local.get $radial_dy
          f64.mul
          f64.const 2
          local.get $p1
          f64.mul
          local.get $x
          f64.mul
          f64.add
          f64.const 2
          local.get $p2
          f64.mul
          local.get $y
          f64.mul
          f64.add
          local.set $dxd_dy
          local.get $y
          local.get $radial_dx
          f64.mul
          f64.const 2
          local.get $p1
          f64.mul
          local.get $x
          f64.mul
          f64.add
          f64.const 2
          local.get $p2
          f64.mul
          local.get $y
          f64.mul
          f64.add
          local.set $dyd_dx
          local.get $radial
          local.get $y
          local.get $radial_dy
          f64.mul
          f64.add
          f64.const 6
          local.get $p1
          f64.mul
          local.get $y
          f64.mul
          f64.add
          f64.const 2
          local.get $p2
          f64.mul
          local.get $x
          f64.mul
          f64.add
          local.set $dyd_dy
          local.get $fx
          local.get $dxd_dx
          f64.mul
          local.set $du_dx
          local.get $fx
          local.get $dxd_dy
          f64.mul
          local.set $du_dy
          local.get $fy
          local.get $dyd_dx
          f64.mul
          local.set $dv_dx
          local.get $fy
          local.get $dyd_dy
          f64.mul
          local.set $dv_dy
          local.get $scratch_ptr
          local.get $du_dx
          local.get $inv_z
          f64.mul
          f64.store
          local.get $scratch_ptr
          i32.const 8
          i32.add
          local.get $du_dy
          local.get $inv_z
          f64.mul
          f64.store
          local.get $scratch_ptr
          i32.const 16
          i32.add
          local.get $du_dx
          local.get $x
          f64.mul
          local.get $du_dy
          local.get $y
          f64.mul
          f64.add
          f64.neg
          local.get $inv_z
          f64.mul
          f64.store
          local.get $scratch_ptr
          i32.const 24
          i32.add
          local.get $dv_dx
          local.get $inv_z
          f64.mul
          f64.store
          local.get $scratch_ptr
          i32.const 32
          i32.add
          local.get $dv_dy
          local.get $inv_z
          f64.mul
          f64.store
          local.get $scratch_ptr
          i32.const 40
          i32.add
          local.get $dv_dx
          local.get $x
          f64.mul
          local.get $dv_dy
          local.get $y
          f64.mul
          f64.add
          f64.neg
          local.get $inv_z
          f64.mul
          f64.store
          local.get $fx
          local.get $xd
          f64.mul
          local.get $cx
          f64.add
          local.set $u
          local.get $fy
          local.get $yd
          f64.mul
          local.get $cy
          f64.add
          local.set $v
          local.get $measurement_ptr
          f64.load
          local.get $u
          f64.sub
          local.set $ru
          local.get $measurement_ptr
          i32.const 8
          i32.add
          f64.load
          local.get $v
          f64.sub
          local.set $rv
          local.get $ru
          local.get $ru
          f64.mul
          local.get $rv
          local.get $rv
          f64.mul
          f64.add
          local.set $err
          local.get $err
          local.get $err
          f64.eq
          local.get $err
          f64.const 1.7976931348623157e+308
          f64.lt
          i32.and
          if
            local.get $err
            f64.sqrt
            local.set $rmag
            f64.const 1
            local.set $w
            local.get $rmag
            local.get $delta
            f64.gt
            if
              local.get $delta
              local.get $rmag
              f64.div
              local.set $w
            end
            local.get $w
            local.get $ru
            f64.mul
            local.set $wru
            local.get $w
            local.get $rv
            f64.mul
            local.set $wrv
            i32.const 0
            local.set $row
            block $label1
              loop $label6
                local.get $row
                i32.const 2
                i32.ge_u
                br_if $label1
                i32.const 0
                local.set $k
                block $label2
                  loop $label5
                    local.get $k
                    i32.const 3
                    i32.ge_u
                    br_if $label2
                    f64.const 0.0
                    local.set $s
                    i32.const 0
                    local.set $j
                    block $label3
                      loop $label4
                        local.get $j
                        i32.const 3
                        i32.ge_u
                        br_if $label3
                        local.get $s
                        local.get $scratch_ptr
                        local.get $row
                        i32.const 3
                        i32.mul
                        local.get $j
                        i32.add
                        i32.const 3
                        i32.shl
                        i32.add
                        f64.load
                        local.get $pose_ptr
                        local.get $j
                        i32.const 3
                        i32.mul
                        local.get $k
                        i32.add
                        i32.const 3
                        i32.shl
                        i32.add
                        f64.load
                        f64.mul
                        f64.add
                        local.set $s
                        local.get $j
                        i32.const 1
                        i32.add
                        local.set $j
                        br $label4
                      end $label4
                    end $label3
                    local.get $scratch_ptr
                    i32.const 48
                    i32.add
                    local.get $row
                    i32.const 3
                    i32.mul
                    local.get $k
                    i32.add
                    i32.const 3
                    i32.shl
                    i32.add
                    local.get $s
                    f64.store
                    local.get $k
                    i32.const 1
                    i32.add
                    local.set $k
                    br $label5
                  end $label5
                end $label2
                local.get $row
                i32.const 1
                i32.add
                local.set $row
                br $label6
              end $label6
            end $label1
            i32.const 0
            local.set $r
            block $label7
              loop $label10
                local.get $r
                i32.const 3
                i32.ge_u
                br_if $label7
                local.get $scratch_ptr
                i32.const 48
                i32.add
                local.get $r
                i32.const 3
                i32.shl
                i32.add
                f64.load
                local.set $j0r
                local.get $scratch_ptr
                i32.const 48
                i32.add
                i32.const 24
                i32.add
                local.get $r
                i32.const 3
                i32.shl
                i32.add
                f64.load
                local.set $j1r
                local.get $out_bp_ptr
                local.get $point_idx
                i32.const 24
                i32.mul
                i32.add
                local.get $r
                i32.const 3
                i32.shl
                i32.add
                local.set $dst_ptr
                local.get $dst_ptr
                local.get $dst_ptr
                f64.load
                local.get $j0r
                local.get $wru
                f64.mul
                local.get $j1r
                local.get $wrv
                f64.mul
                f64.add
                f64.add
                f64.store
                i32.const 0
                local.set $c
                block $label8
                  loop $label9
                    local.get $c
                    i32.const 3
                    i32.ge_u
                    br_if $label8
                    local.get $out_vp_ptr
                    local.get $point_idx
                    i32.const 72
                    i32.mul
                    i32.add
                    local.get $r
                    i32.const 3
                    i32.mul
                    local.get $c
                    i32.add
                    i32.const 3
                    i32.shl
                    i32.add
                    local.set $dst_ptr
                    local.get $dst_ptr
                    local.get $dst_ptr
                    f64.load
                    local.get $w
                    local.get $j0r
                    local.get $scratch_ptr
                    i32.const 48
                    i32.add
                    local.get $c
                    i32.const 3
                    i32.shl
                    i32.add
                    f64.load
                    f64.mul
                    local.get $j1r
                    local.get $scratch_ptr
                    i32.const 48
                    i32.add
                    i32.const 24
                    i32.add
                    local.get $c
                    i32.const 3
                    i32.shl
                    i32.add
                    f64.load
                    f64.mul
                    f64.add
                    f64.mul
                    f64.add
                    f64.store
                    local.get $c
                    i32.const 1
                    i32.add
                    local.set $c
                    br $label9
                  end $label9
                end $label8
                local.get $r
                i32.const 1
                i32.add
                local.set $r
                br $label10
              end $label10
            end $label7
            local.get $cam_opt
            i32.const 0
            i32.ge_s
            if
              local.get $scratch_ptr
              i32.const 192
              i32.add
              f64.const 0.0
              f64.store
              local.get $scratch_ptr
              i32.const 200
              i32.add
              local.get $rz
              f64.store
              local.get $scratch_ptr
              i32.const 208
              i32.add
              local.get $ry
              f64.neg
              f64.store
              local.get $scratch_ptr
              i32.const 216
              i32.add
              local.get $rz
              f64.neg
              f64.store
              local.get $scratch_ptr
              i32.const 224
              i32.add
              f64.const 0.0
              f64.store
              local.get $scratch_ptr
              i32.const 232
              i32.add
              local.get $rx
              f64.store
              local.get $scratch_ptr
              i32.const 240
              i32.add
              local.get $ry
              f64.store
              local.get $scratch_ptr
              i32.const 248
              i32.add
              local.get $rx
              f64.neg
              f64.store
              local.get $scratch_ptr
              i32.const 256
              i32.add
              f64.const 0.0
              f64.store
              i32.const 0
              local.set $row
              block $label11
                loop $label16
                  local.get $row
                  i32.const 2
                  i32.ge_u
                  br_if $label11
                  i32.const 0
                  local.set $k
                  block $label12
                    loop $label15
                      local.get $k
                      i32.const 3
                      i32.ge_u
                      br_if $label12
                      f64.const 0.0
                      local.set $s
                      i32.const 0
                      local.set $j
                      block $label13
                        loop $label14
                          local.get $j
                          i32.const 3
                          i32.ge_u
                          br_if $label13
                          local.get $s
                          local.get $scratch_ptr
                          local.get $row
                          i32.const 3
                          i32.mul
                          local.get $j
                          i32.add
                          i32.const 3
                          i32.shl
                          i32.add
                          f64.load
                          local.get $scratch_ptr
                          i32.const 192
                          i32.add
                          local.get $j
                          i32.const 3
                          i32.mul
                          local.get $k
                          i32.add
                          i32.const 3
                          i32.shl
                          i32.add
                          f64.load
                          f64.mul
                          f64.add
                          local.set $s
                          local.get $j
                          i32.const 1
                          i32.add
                          local.set $j
                          br $label14
                        end $label14
                      end $label13
                      local.get $scratch_ptr
                      i32.const 96
                      i32.add
                      local.get $row
                      i32.const 6
                      i32.mul
                      local.get $k
                      i32.add
                      i32.const 3
                      i32.shl
                      i32.add
                      local.get $s
                      f64.store
                      local.get $scratch_ptr
                      i32.const 96
                      i32.add
                      local.get $row
                      i32.const 6
                      i32.mul
                      i32.const 3
                      i32.add
                      local.get $k
                      i32.add
                      i32.const 3
                      i32.shl
                      i32.add
                      local.get $scratch_ptr
                      local.get $row
                      i32.const 3
                      i32.mul
                      local.get $k
                      i32.add
                      i32.const 3
                      i32.shl
                      i32.add
                      f64.load
                      f64.store
                      local.get $k
                      i32.const 1
                      i32.add
                      local.set $k
                      br $label15
                    end $label15
                  end $label12
                  local.get $row
                  i32.const 1
                  i32.add
                  local.set $row
                  br $label16
                end $label16
              end $label11
              i32.const 0
              local.set $r
              block $label17
                loop $label22
                  local.get $r
                  i32.const 6
                  i32.ge_u
                  br_if $label17
                  local.get $scratch_ptr
                  i32.const 96
                  i32.add
                  local.get $r
                  i32.const 3
                  i32.shl
                  i32.add
                  f64.load
                  local.set $j0r
                  local.get $scratch_ptr
                  i32.const 96
                  i32.add
                  i32.const 48
                  i32.add
                  local.get $r
                  i32.const 3
                  i32.shl
                  i32.add
                  f64.load
                  local.set $j1r
                  local.get $out_bc_ptr
                  local.get $cam_opt
                  i32.const 48
                  i32.mul
                  i32.add
                  local.get $r
                  i32.const 3
                  i32.shl
                  i32.add
                  local.set $dst_ptr
                  local.get $dst_ptr
                  local.get $dst_ptr
                  f64.load
                  local.get $j0r
                  local.get $wru
                  f64.mul
                  local.get $j1r
                  local.get $wrv
                  f64.mul
                  f64.add
                  f64.add
                  f64.store
                  i32.const 0
                  local.set $c
                  block $label18
                    loop $label19
                      local.get $c
                      i32.const 6
                      i32.ge_u
                      br_if $label18
                      local.get $out_u_ptr
                      local.get $cam_opt
                      i32.const 288
                      i32.mul
                      i32.add
                      local.get $r
                      i32.const 6
                      i32.mul
                      local.get $c
                      i32.add
                      i32.const 3
                      i32.shl
                      i32.add
                      local.set $dst_ptr
                      local.get $dst_ptr
                      local.get $dst_ptr
                      f64.load
                      local.get $w
                      local.get $j0r
                      local.get $scratch_ptr
                      i32.const 96
                      i32.add
                      local.get $c
                      i32.const 3
                      i32.shl
                      i32.add
                      f64.load
                      f64.mul
                      local.get $j1r
                      local.get $scratch_ptr
                      i32.const 96
                      i32.add
                      i32.const 48
                      i32.add
                      local.get $c
                      i32.const 3
                      i32.shl
                      i32.add
                      f64.load
                      f64.mul
                      f64.add
                      f64.mul
                      f64.add
                      f64.store
                      local.get $c
                      i32.const 1
                      i32.add
                      local.set $c
                      br $label19
                    end $label19
                  end $label18
                  i32.const 0
                  local.set $c
                  block $label20
                    loop $label21
                      local.get $c
                      i32.const 3
                      i32.ge_u
                      br_if $label20
                      local.get $out_w_ptr
                      local.get $w_index
                      local.get $r
                      i32.const 3
                      i32.mul
                      i32.add
                      local.get $c
                      i32.add
                      i32.const 3
                      i32.shl
                      i32.add
                      local.get $w
                      local.get $j0r
                      local.get $scratch_ptr
                      i32.const 48
                      i32.add
                      local.get $c
                      i32.const 3
                      i32.shl
                      i32.add
                      f64.load
                      f64.mul
                      local.get $j1r
                      local.get $scratch_ptr
                      i32.const 48
                      i32.add
                      i32.const 24
                      i32.add
                      local.get $c
                      i32.const 3
                      i32.shl
                      i32.add
                      f64.load
                      f64.mul
                      f64.add
                      f64.mul
                      f64.store
                      local.get $c
                      i32.const 1
                      i32.add
                      local.set $c
                      br $label21
                    end $label21
                  end $label20
                  local.get $r
                  i32.const 1
                  i32.add
                  local.set $r
                  br $label22
                end $label22
              end $label17
            end
            local.get $count
            i32.const 1
            i32.add
            local.set $count
          end
        end
        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $label23
      end $label23
    end $label0
    local.get $count
  )
  (func $sfm_invert3_damped_f64 (;10;) (param $src_ptr (;0;) i32) (param $lambda (;1;) f64) (param $out_ptr (;2;) i32) (result i32)
    (local $a f64)
    (local $b f64)
    (local $c f64)
    (local $d f64)
    (local $e f64)
    (local $f f64)
    (local $g f64)
    (local $h f64)
    (local $i f64)
    (local $det f64)
    (local $inv f64)
    (local $ok i32)
    local.get $src_ptr
    f64.load
    local.get $lambda
    f64.add
    local.set $a
    local.get $src_ptr
    f64.load offset=8
    local.set $b
    local.get $src_ptr
    f64.load offset=16
    local.set $c
    local.get $src_ptr
    f64.load offset=24
    local.set $d
    local.get $src_ptr
    f64.load offset=32
    local.get $lambda
    f64.add
    local.set $e
    local.get $src_ptr
    f64.load offset=40
    local.set $f
    local.get $src_ptr
    f64.load offset=48
    local.set $g
    local.get $src_ptr
    f64.load offset=56
    local.set $h
    local.get $src_ptr
    f64.load offset=64
    local.get $lambda
    f64.add
    local.set $i
    local.get $a
    local.get $e
    local.get $i
    f64.mul
    local.get $f
    local.get $h
    f64.mul
    f64.sub
    f64.mul
    local.get $b
    local.get $d
    local.get $i
    f64.mul
    local.get $f
    local.get $g
    f64.mul
    f64.sub
    f64.mul
    f64.sub
    local.get $c
    local.get $d
    local.get $h
    f64.mul
    local.get $e
    local.get $g
    f64.mul
    f64.sub
    f64.mul
    f64.add
    local.set $det
    i32.const 0
    local.set $ok
    local.get $det
    local.get $det
    f64.eq
    local.get $det
    f64.abs
    f64.const 1e-15
    f64.gt
    i32.and
    local.get $det
    f64.abs
    f64.const 1.7976931348623157e+308
    f64.lt
    i32.and
    if
      f64.const 1
      local.get $det
      f64.div
      local.set $inv
      local.get $out_ptr
      local.get $e
      local.get $i
      f64.mul
      local.get $f
      local.get $h
      f64.mul
      f64.sub
      local.get $inv
      f64.mul
      f64.store
      local.get $out_ptr
      local.get $c
      local.get $h
      f64.mul
      local.get $b
      local.get $i
      f64.mul
      f64.sub
      local.get $inv
      f64.mul
      f64.store offset=8
      local.get $out_ptr
      local.get $b
      local.get $f
      f64.mul
      local.get $c
      local.get $e
      f64.mul
      f64.sub
      local.get $inv
      f64.mul
      f64.store offset=16
      local.get $out_ptr
      local.get $f
      local.get $g
      f64.mul
      local.get $d
      local.get $i
      f64.mul
      f64.sub
      local.get $inv
      f64.mul
      f64.store offset=24
      local.get $out_ptr
      local.get $a
      local.get $i
      f64.mul
      local.get $c
      local.get $g
      f64.mul
      f64.sub
      local.get $inv
      f64.mul
      f64.store offset=32
      local.get $out_ptr
      local.get $c
      local.get $d
      f64.mul
      local.get $a
      local.get $f
      f64.mul
      f64.sub
      local.get $inv
      f64.mul
      f64.store offset=40
      local.get $out_ptr
      local.get $d
      local.get $h
      f64.mul
      local.get $e
      local.get $g
      f64.mul
      f64.sub
      local.get $inv
      f64.mul
      f64.store offset=48
      local.get $out_ptr
      local.get $b
      local.get $g
      f64.mul
      local.get $a
      local.get $h
      f64.mul
      f64.sub
      local.get $inv
      f64.mul
      f64.store offset=56
      local.get $out_ptr
      local.get $a
      local.get $e
      f64.mul
      local.get $b
      local.get $d
      f64.mul
      f64.sub
      local.get $inv
      f64.mul
      f64.store offset=64
      i32.const 1
      local.set $ok
    end
    local.get $ok
  )
  (func $sfm_bundle_reduce_schur_f64 (;11;) (export "sfm_bundle_reduce_schur_f64") (param $obs_indices_ptr (;0;) i32) (param $point_ranges_ptr (;1;) i32) (param $point_count (;2;) i32) (param $camera_count (;3;) i32) (param $u_ptr (;4;) i32) (param $bc_ptr (;5;) i32) (param $vp_ptr (;6;) i32) (param $bp_ptr (;7;) i32) (param $w_ptr_base (;8;) i32) (param $lambda (;9;) f64) (param $out_s_ptr (;10;) i32) (param $out_rhs_ptr (;11;) i32) (param $out_vinv_ptr (;12;) i32) (param $out_valid_ptr (;13;) i32) (result i32)
    (local $cam_dim i32)
    (local $total i32)
    (local $idx i32)
    (local $cam i32)
    (local $row i32)
    (local $col i32)
    (local $p i32)
    (local $valid_count i32)
    (local $range_ptr i32)
    (local $obs_start i32)
    (local $obs_count i32)
    (local $obs_ptr i32)
    (local $oi i32)
    (local $oj i32)
    (local $ci i32)
    (local $cj i32)
    (local $w_index i32)
    (local $vinv_ptr i32)
    (local $bp_i_ptr i32)
    (local $w_i_ptr i32)
    (local $w_j_ptr i32)
    (local $dst_ptr i32)
    (local $vbp0 f64)
    (local $vbp1 f64)
    (local $vbp2 f64)
    (local $w0 f64)
    (local $w1 f64)
    (local $w2 f64)
    (local $k0 f64)
    (local $k1 f64)
    (local $k2 f64)
    (local $value f64)
    local.get $camera_count
    i32.const 6
    i32.mul
    local.set $cam_dim
    local.get $cam_dim
    local.get $cam_dim
    i32.mul
    local.set $total
    i32.const 0
    local.set $idx
    block $label0
      loop $label1
        local.get $idx
        local.get $total
        i32.ge_u
        br_if $label0
        local.get $out_s_ptr
        local.get $idx
        i32.const 3
        i32.shl
        i32.add
        f64.const 0.0
        f64.store
        local.get $idx
        i32.const 1
        i32.add
        local.set $idx
        br $label1
      end $label1
    end $label0
    i32.const 0
    local.set $idx
    block $label2
      loop $label3
        local.get $idx
        local.get $cam_dim
        i32.ge_u
        br_if $label2
        local.get $out_rhs_ptr
        local.get $idx
        i32.const 3
        i32.shl
        i32.add
        f64.const 0.0
        f64.store
        local.get $idx
        i32.const 1
        i32.add
        local.set $idx
        br $label3
      end $label3
    end $label2
    i32.const 0
    local.set $cam
    block $label4
      loop $label9
        local.get $cam
        local.get $camera_count
        i32.ge_u
        br_if $label4
        i32.const 0
        local.set $row
        block $label5
          loop $label8
            local.get $row
            i32.const 6
            i32.ge_u
            br_if $label5
            local.get $out_rhs_ptr
            local.get $cam
            i32.const 6
            i32.mul
            local.get $row
            i32.add
            i32.const 3
            i32.shl
            i32.add
            local.get $bc_ptr
            local.get $cam
            i32.const 48
            i32.mul
            i32.add
            local.get $row
            i32.const 3
            i32.shl
            i32.add
            f64.load
            f64.store
            i32.const 0
            local.set $col
            block $label6
              loop $label7
                local.get $col
                i32.const 6
                i32.ge_u
                br_if $label6
                local.get $u_ptr
                local.get $cam
                i32.const 288
                i32.mul
                i32.add
                local.get $row
                i32.const 6
                i32.mul
                local.get $col
                i32.add
                i32.const 3
                i32.shl
                i32.add
                f64.load
                local.set $value
                local.get $row
                local.get $col
                i32.eq
                if
                  local.get $value
                  local.get $lambda
                  f64.add
                  local.set $value
                end
                local.get $out_s_ptr
                local.get $cam
                i32.const 6
                i32.mul
                local.get $row
                i32.add
                local.get $cam_dim
                i32.mul
                local.get $cam
                i32.const 6
                i32.mul
                local.get $col
                i32.add
                i32.add
                i32.const 3
                i32.shl
                i32.add
                local.get $value
                f64.store
                local.get $col
                i32.const 1
                i32.add
                local.set $col
                br $label7
              end $label7
            end $label6
            local.get $row
            i32.const 1
            i32.add
            local.set $row
            br $label8
          end $label8
        end $label5
        local.get $cam
        i32.const 1
        i32.add
        local.set $cam
        br $label9
      end $label9
    end $label4
    i32.const 0
    local.set $valid_count
    i32.const 0
    local.set $p
    block $label10
      loop $label23
        local.get $p
        local.get $point_count
        i32.ge_u
        br_if $label10
        local.get $out_valid_ptr
        local.get $p
        i32.add
        i32.const 0
        i32.store8
        local.get $point_ranges_ptr
        local.get $p
        i32.const 3
        i32.shl
        i32.add
        local.set $range_ptr
        local.get $range_ptr
        i32.load
        local.set $obs_start
        local.get $range_ptr
        i32.const 4
        i32.add
        i32.load
        local.set $obs_count
        local.get $obs_count
        i32.const 2
        i32.ge_u
        if
          local.get $out_vinv_ptr
          local.get $p
          i32.const 72
          i32.mul
          i32.add
          local.set $vinv_ptr
          local.get $bp_ptr
          local.get $p
          i32.const 24
          i32.mul
          i32.add
          local.set $bp_i_ptr
          local.get $vp_ptr
          local.get $p
          i32.const 72
          i32.mul
          i32.add
          local.get $lambda
          local.get $vinv_ptr
          call $sfm_invert3_damped_f64
          if
            local.get $out_valid_ptr
            local.get $p
            i32.add
            i32.const 1
            i32.store8
            local.get $valid_count
            i32.const 1
            i32.add
            local.set $valid_count
            local.get $vinv_ptr
            f64.load
            local.get $bp_i_ptr
            f64.load
            f64.mul
            local.get $vinv_ptr
            f64.load offset=8
            local.get $bp_i_ptr
            f64.load offset=8
            f64.mul
            f64.add
            local.get $vinv_ptr
            f64.load offset=16
            local.get $bp_i_ptr
            f64.load offset=16
            f64.mul
            f64.add
            local.set $vbp0
            local.get $vinv_ptr
            f64.load offset=24
            local.get $bp_i_ptr
            f64.load
            f64.mul
            local.get $vinv_ptr
            f64.load offset=32
            local.get $bp_i_ptr
            f64.load offset=8
            f64.mul
            f64.add
            local.get $vinv_ptr
            f64.load offset=40
            local.get $bp_i_ptr
            f64.load offset=16
            f64.mul
            f64.add
            local.set $vbp1
            local.get $vinv_ptr
            f64.load offset=48
            local.get $bp_i_ptr
            f64.load
            f64.mul
            local.get $vinv_ptr
            f64.load offset=56
            local.get $bp_i_ptr
            f64.load offset=8
            f64.mul
            f64.add
            local.get $vinv_ptr
            f64.load offset=64
            local.get $bp_i_ptr
            f64.load offset=16
            f64.mul
            f64.add
            local.set $vbp2
            i32.const 0
            local.set $oi
            block $label11
              loop $label14
                local.get $oi
                local.get $obs_count
                i32.ge_u
                br_if $label11
                local.get $obs_indices_ptr
                local.get $obs_start
                local.get $oi
                i32.add
                i32.const 4
                i32.shl
                i32.add
                local.set $obs_ptr
                local.get $obs_ptr
                i32.load offset=8
                local.set $ci
                local.get $ci
                i32.const 0
                i32.ge_s
                if
                  local.get $obs_ptr
                  i32.load offset=12
                  local.set $w_index
                  local.get $w_ptr_base
                  local.get $w_index
                  i32.const 3
                  i32.shl
                  i32.add
                  local.set $w_i_ptr
                  i32.const 0
                  local.set $row
                  block $label12
                    loop $label13
                      local.get $row
                      i32.const 6
                      i32.ge_u
                      br_if $label12
                      local.get $out_rhs_ptr
                      local.get $ci
                      i32.const 6
                      i32.mul
                      local.get $row
                      i32.add
                      i32.const 3
                      i32.shl
                      i32.add
                      local.set $dst_ptr
                      local.get $dst_ptr
                      local.get $dst_ptr
                      f64.load
                      local.get $w_i_ptr
                      local.get $row
                      i32.const 24
                      i32.mul
                      i32.add
                      f64.load
                      local.get $vbp0
                      f64.mul
                      local.get $w_i_ptr
                      local.get $row
                      i32.const 24
                      i32.mul
                      i32.add
                      f64.load offset=8
                      local.get $vbp1
                      f64.mul
                      f64.add
                      local.get $w_i_ptr
                      local.get $row
                      i32.const 24
                      i32.mul
                      i32.add
                      f64.load offset=16
                      local.get $vbp2
                      f64.mul
                      f64.add
                      f64.sub
                      f64.store
                      local.get $row
                      i32.const 1
                      i32.add
                      local.set $row
                      br $label13
                    end $label13
                  end $label12
                end
                local.get $oi
                i32.const 1
                i32.add
                local.set $oi
                br $label14
              end $label14
            end $label11
            i32.const 0
            local.set $oi
            block $label15
              loop $label22
                local.get $oi
                local.get $obs_count
                i32.ge_u
                br_if $label15
                local.get $obs_indices_ptr
                local.get $obs_start
                local.get $oi
                i32.add
                i32.const 4
                i32.shl
                i32.add
                local.set $obs_ptr
                local.get $obs_ptr
                i32.load offset=8
                local.set $ci
                local.get $ci
                i32.const 0
                i32.ge_s
                if
                  local.get $obs_ptr
                  i32.load offset=12
                  local.set $w_index
                  local.get $w_ptr_base
                  local.get $w_index
                  i32.const 3
                  i32.shl
                  i32.add
                  local.set $w_i_ptr
                  i32.const 0
                  local.set $row
                  block $label16
                    loop $label21
                      local.get $row
                      i32.const 6
                      i32.ge_u
                      br_if $label16
                      local.get $w_i_ptr
                      local.get $row
                      i32.const 24
                      i32.mul
                      i32.add
                      f64.load
                      local.set $w0
                      local.get $w_i_ptr
                      local.get $row
                      i32.const 24
                      i32.mul
                      i32.add
                      f64.load offset=8
                      local.set $w1
                      local.get $w_i_ptr
                      local.get $row
                      i32.const 24
                      i32.mul
                      i32.add
                      f64.load offset=16
                      local.set $w2
                      local.get $w0
                      local.get $vinv_ptr
                      f64.load
                      f64.mul
                      local.get $w1
                      local.get $vinv_ptr
                      f64.load offset=24
                      f64.mul
                      f64.add
                      local.get $w2
                      local.get $vinv_ptr
                      f64.load offset=48
                      f64.mul
                      f64.add
                      local.set $k0
                      local.get $w0
                      local.get $vinv_ptr
                      f64.load offset=8
                      f64.mul
                      local.get $w1
                      local.get $vinv_ptr
                      f64.load offset=32
                      f64.mul
                      f64.add
                      local.get $w2
                      local.get $vinv_ptr
                      f64.load offset=56
                      f64.mul
                      f64.add
                      local.set $k1
                      local.get $w0
                      local.get $vinv_ptr
                      f64.load offset=16
                      f64.mul
                      local.get $w1
                      local.get $vinv_ptr
                      f64.load offset=40
                      f64.mul
                      f64.add
                      local.get $w2
                      local.get $vinv_ptr
                      f64.load offset=64
                      f64.mul
                      f64.add
                      local.set $k2
                      i32.const 0
                      local.set $oj
                      block $label17
                        loop $label20
                          local.get $oj
                          local.get $obs_count
                          i32.ge_u
                          br_if $label17
                          local.get $obs_indices_ptr
                          local.get $obs_start
                          local.get $oj
                          i32.add
                          i32.const 4
                          i32.shl
                          i32.add
                          local.set $obs_ptr
                          local.get $obs_ptr
                          i32.load offset=8
                          local.set $cj
                          local.get $cj
                          i32.const 0
                          i32.ge_s
                          if
                            local.get $obs_ptr
                            i32.load offset=12
                            local.set $w_index
                            local.get $w_ptr_base
                            local.get $w_index
                            i32.const 3
                            i32.shl
                            i32.add
                            local.set $w_j_ptr
                            i32.const 0
                            local.set $col
                            block $label18
                              loop $label19
                                local.get $col
                                i32.const 6
                                i32.ge_u
                                br_if $label18
                                local.get $k0
                                local.get $w_j_ptr
                                local.get $col
                                i32.const 24
                                i32.mul
                                i32.add
                                f64.load
                                f64.mul
                                local.get $k1
                                local.get $w_j_ptr
                                local.get $col
                                i32.const 24
                                i32.mul
                                i32.add
                                f64.load offset=8
                                f64.mul
                                f64.add
                                local.get $k2
                                local.get $w_j_ptr
                                local.get $col
                                i32.const 24
                                i32.mul
                                i32.add
                                f64.load offset=16
                                f64.mul
                                f64.add
                                local.set $value
                                local.get $out_s_ptr
                                local.get $ci
                                i32.const 6
                                i32.mul
                                local.get $row
                                i32.add
                                local.get $cam_dim
                                i32.mul
                                local.get $cj
                                i32.const 6
                                i32.mul
                                local.get $col
                                i32.add
                                i32.add
                                i32.const 3
                                i32.shl
                                i32.add
                                local.set $dst_ptr
                                local.get $dst_ptr
                                local.get $dst_ptr
                                f64.load
                                local.get $value
                                f64.sub
                                f64.store
                                local.get $col
                                i32.const 1
                                i32.add
                                local.set $col
                                br $label19
                              end $label19
                            end $label18
                          end
                          local.get $oj
                          i32.const 1
                          i32.add
                          local.set $oj
                          br $label20
                        end $label20
                      end $label17
                      local.get $row
                      i32.const 1
                      i32.add
                      local.set $row
                      br $label21
                    end $label21
                  end $label16
                end
                local.get $oi
                i32.const 1
                i32.add
                local.set $oi
                br $label22
              end $label22
            end $label15
          end
        end
        local.get $p
        i32.const 1
        i32.add
        local.set $p
        br $label23
      end $label23
    end $label10
    local.get $valid_count
  )
  (func $sfm_bundle_back_substitute_f64 (;12;) (export "sfm_bundle_back_substitute_f64") (param $obs_indices_ptr (;0;) i32) (param $point_ranges_ptr (;1;) i32) (param $point_count (;2;) i32) (param $bp_ptr (;3;) i32) (param $w_ptr_base (;4;) i32) (param $vinv_ptr_base (;5;) i32) (param $valid_ptr (;6;) i32) (param $delta_cam_ptr (;7;) i32) (param $out_delta_pt_ptr (;8;) i32) (result i32)
    (local $p i32)
    (local $processed i32)
    (local $range_ptr i32)
    (local $obs_start i32)
    (local $obs_count i32)
    (local $obs_ptr i32)
    (local $oi i32)
    (local $row i32)
    (local $ci i32)
    (local $w_index i32)
    (local $bp_i_ptr i32)
    (local $w_i_ptr i32)
    (local $vinv_ptr i32)
    (local $dst_ptr i32)
    (local $bx f64)
    (local $by f64)
    (local $bz f64)
    (local $dc f64)
    i32.const 0
    local.set $processed
    i32.const 0
    local.set $p
    block $label0
      loop $label5
        local.get $p
        local.get $point_count
        i32.ge_u
        br_if $label0
        local.get $out_delta_pt_ptr
        local.get $p
        i32.const 24
        i32.mul
        i32.add
        local.set $dst_ptr
        local.get $dst_ptr
        f64.const 0.0
        f64.store
        local.get $dst_ptr
        f64.const 0.0
        f64.store offset=8
        local.get $dst_ptr
        f64.const 0.0
        f64.store offset=16
        local.get $valid_ptr
        local.get $p
        i32.add
        i32.load8_u
        i32.const 0
        i32.ne
        if
          local.get $point_ranges_ptr
          local.get $p
          i32.const 3
          i32.shl
          i32.add
          local.set $range_ptr
          local.get $range_ptr
          i32.load
          local.set $obs_start
          local.get $range_ptr
          i32.const 4
          i32.add
          i32.load
          local.set $obs_count
          local.get $bp_ptr
          local.get $p
          i32.const 24
          i32.mul
          i32.add
          local.set $bp_i_ptr
          local.get $vinv_ptr_base
          local.get $p
          i32.const 72
          i32.mul
          i32.add
          local.set $vinv_ptr
          local.get $bp_i_ptr
          f64.load
          local.set $bx
          local.get $bp_i_ptr
          f64.load offset=8
          local.set $by
          local.get $bp_i_ptr
          f64.load offset=16
          local.set $bz
          i32.const 0
          local.set $oi
          block $label1
            loop $label4
              local.get $oi
              local.get $obs_count
              i32.ge_u
              br_if $label1
              local.get $obs_indices_ptr
              local.get $obs_start
              local.get $oi
              i32.add
              i32.const 4
              i32.shl
              i32.add
              local.set $obs_ptr
              local.get $obs_ptr
              i32.load offset=8
              local.set $ci
              local.get $ci
              i32.const 0
              i32.ge_s
              if
                local.get $obs_ptr
                i32.load offset=12
                local.set $w_index
                local.get $w_ptr_base
                local.get $w_index
                i32.const 3
                i32.shl
                i32.add
                local.set $w_i_ptr
                i32.const 0
                local.set $row
                block $label2
                  loop $label3
                    local.get $row
                    i32.const 6
                    i32.ge_u
                    br_if $label2
                    local.get $delta_cam_ptr
                    local.get $ci
                    i32.const 6
                    i32.mul
                    local.get $row
                    i32.add
                    i32.const 3
                    i32.shl
                    i32.add
                    f64.load
                    local.set $dc
                    local.get $bx
                    local.get $w_i_ptr
                    local.get $row
                    i32.const 24
                    i32.mul
                    i32.add
                    f64.load
                    local.get $dc
                    f64.mul
                    f64.sub
                    local.set $bx
                    local.get $by
                    local.get $w_i_ptr
                    local.get $row
                    i32.const 24
                    i32.mul
                    i32.add
                    f64.load offset=8
                    local.get $dc
                    f64.mul
                    f64.sub
                    local.set $by
                    local.get $bz
                    local.get $w_i_ptr
                    local.get $row
                    i32.const 24
                    i32.mul
                    i32.add
                    f64.load offset=16
                    local.get $dc
                    f64.mul
                    f64.sub
                    local.set $bz
                    local.get $row
                    i32.const 1
                    i32.add
                    local.set $row
                    br $label3
                  end $label3
                end $label2
              end
              local.get $oi
              i32.const 1
              i32.add
              local.set $oi
              br $label4
            end $label4
          end $label1
          local.get $dst_ptr
          local.get $vinv_ptr
          f64.load
          local.get $bx
          f64.mul
          local.get $vinv_ptr
          f64.load offset=8
          local.get $by
          f64.mul
          f64.add
          local.get $vinv_ptr
          f64.load offset=16
          local.get $bz
          f64.mul
          f64.add
          f64.store
          local.get $dst_ptr
          local.get $vinv_ptr
          f64.load offset=24
          local.get $bx
          f64.mul
          local.get $vinv_ptr
          f64.load offset=32
          local.get $by
          f64.mul
          f64.add
          local.get $vinv_ptr
          f64.load offset=40
          local.get $bz
          f64.mul
          f64.add
          f64.store offset=8
          local.get $dst_ptr
          local.get $vinv_ptr
          f64.load offset=48
          local.get $bx
          f64.mul
          local.get $vinv_ptr
          f64.load offset=56
          local.get $by
          f64.mul
          f64.add
          local.get $vinv_ptr
          f64.load offset=64
          local.get $bz
          f64.mul
          f64.add
          f64.store offset=16
          local.get $processed
          i32.const 1
          i32.add
          local.set $processed
        end
        local.get $p
        i32.const 1
        i32.add
        local.set $p
        br $label5
      end $label5
    end $label0
    local.get $processed
  )
  (func $sfm_triangulate_normalized_pairs_f64 (;13;) (export "sfm_triangulate_normalized_pairs_f64") (param $pairs_ptr (;0;) i32) (param $pair_count (;1;) i32) (param $pose1_ptr (;2;) i32) (param $pose2_ptr (;3;) i32) (param $out_ptr (;4;) i32) (result i32)
    (local $i i32)
    (local $pair_ptr i32)
    (local $out_pair_ptr i32)
    (local $a0 f64)
    (local $a1 f64)
    (local $a2 f64)
    (local $a3 f64)
    (local $a4 f64)
    (local $a5 f64)
    (local $a6 f64)
    (local $a7 f64)
    (local $a8 f64)
    (local $at0 f64)
    (local $at1 f64)
    (local $at2 f64)
    (local $b0 f64)
    (local $b1 f64)
    (local $b2 f64)
    (local $b3 f64)
    (local $b4 f64)
    (local $b5 f64)
    (local $b6 f64)
    (local $b7 f64)
    (local $b8 f64)
    (local $bt0 f64)
    (local $bt1 f64)
    (local $bt2 f64)
    (local $c1x f64)
    (local $c1y f64)
    (local $c1z f64)
    (local $c2x f64)
    (local $c2y f64)
    (local $c2z f64)
    (local $x1 f64)
    (local $y1 f64)
    (local $x2 f64)
    (local $y2 f64)
    (local $n1 f64)
    (local $n2 f64)
    (local $d1x f64)
    (local $d1y f64)
    (local $d1z f64)
    (local $d2x f64)
    (local $d2y f64)
    (local $d2z f64)
    (local $d1n f64)
    (local $d2n f64)
    (local $rx f64)
    (local $ry f64)
    (local $rz f64)
    (local $bdot f64)
    (local $denom f64)
    (local $d1r f64)
    (local $d2r f64)
    (local $s f64)
    (local $u f64)
    (local $X f64)
    (local $Y f64)
    (local $Z f64)
    (local $cam1z f64)
    (local $cam2z f64)
    local.get $pose1_ptr
    f64.load
    local.set $a0
    local.get $pose1_ptr
    f64.load offset=8
    local.set $a1
    local.get $pose1_ptr
    f64.load offset=16
    local.set $a2
    local.get $pose1_ptr
    f64.load offset=24
    local.set $a3
    local.get $pose1_ptr
    f64.load offset=32
    local.set $a4
    local.get $pose1_ptr
    f64.load offset=40
    local.set $a5
    local.get $pose1_ptr
    f64.load offset=48
    local.set $a6
    local.get $pose1_ptr
    f64.load offset=56
    local.set $a7
    local.get $pose1_ptr
    f64.load offset=64
    local.set $a8
    local.get $pose1_ptr
    f64.load offset=72
    local.set $at0
    local.get $pose1_ptr
    f64.load offset=80
    local.set $at1
    local.get $pose1_ptr
    f64.load offset=88
    local.set $at2
    local.get $pose2_ptr
    f64.load
    local.set $b0
    local.get $pose2_ptr
    f64.load offset=8
    local.set $b1
    local.get $pose2_ptr
    f64.load offset=16
    local.set $b2
    local.get $pose2_ptr
    f64.load offset=24
    local.set $b3
    local.get $pose2_ptr
    f64.load offset=32
    local.set $b4
    local.get $pose2_ptr
    f64.load offset=40
    local.set $b5
    local.get $pose2_ptr
    f64.load offset=48
    local.set $b6
    local.get $pose2_ptr
    f64.load offset=56
    local.set $b7
    local.get $pose2_ptr
    f64.load offset=64
    local.set $b8
    local.get $pose2_ptr
    f64.load offset=72
    local.set $bt0
    local.get $pose2_ptr
    f64.load offset=80
    local.set $bt1
    local.get $pose2_ptr
    f64.load offset=88
    local.set $bt2
    f64.const -1
    local.get $a0
    local.get $at0
    f64.mul
    local.get $a3
    local.get $at1
    f64.mul
    f64.add
    local.get $a6
    local.get $at2
    f64.mul
    f64.add
    f64.mul
    local.set $c1x
    f64.const -1
    local.get $a1
    local.get $at0
    f64.mul
    local.get $a4
    local.get $at1
    f64.mul
    f64.add
    local.get $a7
    local.get $at2
    f64.mul
    f64.add
    f64.mul
    local.set $c1y
    f64.const -1
    local.get $a2
    local.get $at0
    f64.mul
    local.get $a5
    local.get $at1
    f64.mul
    f64.add
    local.get $a8
    local.get $at2
    f64.mul
    f64.add
    f64.mul
    local.set $c1z
    f64.const -1
    local.get $b0
    local.get $bt0
    f64.mul
    local.get $b3
    local.get $bt1
    f64.mul
    f64.add
    local.get $b6
    local.get $bt2
    f64.mul
    f64.add
    f64.mul
    local.set $c2x
    f64.const -1
    local.get $b1
    local.get $bt0
    f64.mul
    local.get $b4
    local.get $bt1
    f64.mul
    f64.add
    local.get $b7
    local.get $bt2
    f64.mul
    f64.add
    f64.mul
    local.set $c2y
    f64.const -1
    local.get $b2
    local.get $bt0
    f64.mul
    local.get $b5
    local.get $bt1
    f64.mul
    f64.add
    local.get $b8
    local.get $bt2
    f64.mul
    f64.add
    f64.mul
    local.set $c2z
    i32.const 0
    local.set $i
    block $label0
      loop $label2
        local.get $i
        local.get $pair_count
        i32.ge_u
        br_if $label0
        local.get $pairs_ptr
        local.get $i
        i32.const 5
        i32.shl
        i32.add
        local.set $pair_ptr
        local.get $out_ptr
        local.get $i
        i32.const 5
        i32.shl
        i32.add
        local.set $out_pair_ptr
        local.get $out_pair_ptr
        f64.const 0.0
        f64.store
        local.get $out_pair_ptr
        f64.const 0.0
        f64.store offset=8
        local.get $out_pair_ptr
        f64.const 0.0
        f64.store offset=16
        local.get $out_pair_ptr
        f64.const 0.0
        f64.store offset=24
        block $label1
          local.get $pair_ptr
          f64.load
          local.set $x1
          local.get $pair_ptr
          f64.load offset=8
          local.set $y1
          local.get $pair_ptr
          f64.load offset=16
          local.set $x2
          local.get $pair_ptr
          f64.load offset=24
          local.set $y2
          local.get $x1
          local.get $x1
          f64.mul
          local.get $y1
          local.get $y1
          f64.mul
          f64.add
          f64.const 1
          f64.add
          f64.sqrt
          f64.const 1
          f64.div
          local.set $n1
          local.get $x2
          local.get $x2
          f64.mul
          local.get $y2
          local.get $y2
          f64.mul
          f64.add
          f64.const 1
          f64.add
          f64.sqrt
          f64.const 1
          f64.div
          local.set $n2
          local.get $a0
          local.get $x1
          f64.mul
          local.get $n1
          f64.mul
          local.get $a3
          local.get $y1
          f64.mul
          local.get $n1
          f64.mul
          f64.add
          local.get $a6
          local.get $n1
          f64.mul
          f64.add
          local.set $d1x
          local.get $a1
          local.get $x1
          f64.mul
          local.get $n1
          f64.mul
          local.get $a4
          local.get $y1
          f64.mul
          local.get $n1
          f64.mul
          f64.add
          local.get $a7
          local.get $n1
          f64.mul
          f64.add
          local.set $d1y
          local.get $a2
          local.get $x1
          f64.mul
          local.get $n1
          f64.mul
          local.get $a5
          local.get $y1
          f64.mul
          local.get $n1
          f64.mul
          f64.add
          local.get $a8
          local.get $n1
          f64.mul
          f64.add
          local.set $d1z
          local.get $b0
          local.get $x2
          f64.mul
          local.get $n2
          f64.mul
          local.get $b3
          local.get $y2
          f64.mul
          local.get $n2
          f64.mul
          f64.add
          local.get $b6
          local.get $n2
          f64.mul
          f64.add
          local.set $d2x
          local.get $b1
          local.get $x2
          f64.mul
          local.get $n2
          f64.mul
          local.get $b4
          local.get $y2
          f64.mul
          local.get $n2
          f64.mul
          f64.add
          local.get $b7
          local.get $n2
          f64.mul
          f64.add
          local.set $d2y
          local.get $b2
          local.get $x2
          f64.mul
          local.get $n2
          f64.mul
          local.get $b5
          local.get $y2
          f64.mul
          local.get $n2
          f64.mul
          f64.add
          local.get $b8
          local.get $n2
          f64.mul
          f64.add
          local.set $d2z
          local.get $d1x
          local.get $d1x
          f64.mul
          local.get $d1y
          local.get $d1y
          f64.mul
          f64.add
          local.get $d1z
          local.get $d1z
          f64.mul
          f64.add
          f64.sqrt
          local.set $d1n
          local.get $d2x
          local.get $d2x
          f64.mul
          local.get $d2y
          local.get $d2y
          f64.mul
          f64.add
          local.get $d2z
          local.get $d2z
          f64.mul
          f64.add
          f64.sqrt
          local.set $d2n
          local.get $d1x
          local.get $d1n
          f64.div
          local.set $d1x
          local.get $d1y
          local.get $d1n
          f64.div
          local.set $d1y
          local.get $d1z
          local.get $d1n
          f64.div
          local.set $d1z
          local.get $d2x
          local.get $d2n
          f64.div
          local.set $d2x
          local.get $d2y
          local.get $d2n
          f64.div
          local.set $d2y
          local.get $d2z
          local.get $d2n
          f64.div
          local.set $d2z
          local.get $c1x
          local.get $c2x
          f64.sub
          local.set $rx
          local.get $c1y
          local.get $c2y
          f64.sub
          local.set $ry
          local.get $c1z
          local.get $c2z
          f64.sub
          local.set $rz
          local.get $d1x
          local.get $d2x
          f64.mul
          local.get $d1y
          local.get $d2y
          f64.mul
          f64.add
          local.get $d1z
          local.get $d2z
          f64.mul
          f64.add
          local.set $bdot
          f64.const 1
          local.get $bdot
          local.get $bdot
          f64.mul
          f64.sub
          local.set $denom
          local.get $denom
          f64.abs
          f64.const 0.000001
          f64.lt
          br_if $label1
          local.get $d2x
          local.get $rx
          f64.mul
          local.get $d2y
          local.get $ry
          f64.mul
          f64.add
          local.get $d2z
          local.get $rz
          f64.mul
          f64.add
          local.set $d2r
          local.get $d1x
          local.get $rx
          f64.mul
          local.get $d1y
          local.get $ry
          f64.mul
          f64.add
          local.get $d1z
          local.get $rz
          f64.mul
          f64.add
          local.set $d1r
          local.get $bdot
          local.get $d2r
          f64.mul
          local.get $d1r
          f64.sub
          local.get $denom
          f64.div
          local.set $s
          local.get $d2r
          local.get $bdot
          local.get $d1r
          f64.mul
          f64.sub
          local.get $denom
          f64.div
          local.set $u
          local.get $c1x
          local.get $d1x
          local.get $s
          f64.mul
          f64.add
          local.get $c2x
          f64.add
          local.get $d2x
          local.get $u
          f64.mul
          f64.add
          f64.const 0.5
          f64.mul
          local.set $X
          local.get $c1y
          local.get $d1y
          local.get $s
          f64.mul
          f64.add
          local.get $c2y
          f64.add
          local.get $d2y
          local.get $u
          f64.mul
          f64.add
          f64.const 0.5
          f64.mul
          local.set $Y
          local.get $c1z
          local.get $d1z
          local.get $s
          f64.mul
          f64.add
          local.get $c2z
          f64.add
          local.get $d2z
          local.get $u
          f64.mul
          f64.add
          f64.const 0.5
          f64.mul
          local.set $Z
          local.get $a6
          local.get $X
          f64.mul
          local.get $a7
          local.get $Y
          f64.mul
          f64.add
          local.get $a8
          local.get $Z
          f64.mul
          f64.add
          local.get $at2
          f64.add
          local.set $cam1z
          local.get $b6
          local.get $X
          f64.mul
          local.get $b7
          local.get $Y
          f64.mul
          f64.add
          local.get $b8
          local.get $Z
          f64.mul
          f64.add
          local.get $bt2
          f64.add
          local.set $cam2z
          local.get $cam1z
          f64.const 0.0
          f64.le
          br_if $label1
          local.get $cam2z
          f64.const 0.0
          f64.le
          br_if $label1
          local.get $out_pair_ptr
          local.get $X
          f64.store
          local.get $out_pair_ptr
          local.get $Y
          f64.store offset=8
          local.get $out_pair_ptr
          local.get $Z
          f64.store offset=16
          local.get $out_pair_ptr
          f64.const 1
          f64.store offset=24
        end $label1
        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $label2
      end $label2
    end $label0
    local.get $pair_count
  )
  (func $round_clamp_i32 (;14;) (param $value (;0;) f64) (param $lo (;1;) i32) (param $hi (;2;) i32) (result i32)
    (local $rounded i32)
    local.get $value
    f64.const 0.5
    f64.add
    f64.floor
    i32.trunc_f64_s
    local.set $rounded
    local.get $rounded
    local.get $lo
    i32.lt_s
    if
      local.get $lo
      return
    end
    local.get $rounded
    local.get $hi
    i32.gt_s
    if
      local.get $hi
      return
    end
    local.get $rounded
  )
  (func $sfm_has_fast9_arc (;15;) (param $bits (;0;) i32) (result i32)
    (local $arc i32)
    local.get $bits
    local.get $bits
    i32.const 16
    i32.shl
    i32.or
    local.set $arc
    local.get $arc
    local.get $arc
    i32.const 1
    i32.shr_u
    i32.and
    local.set $arc
    local.get $arc
    local.get $arc
    i32.const 1
    i32.shr_u
    i32.and
    local.set $arc
    local.get $arc
    local.get $arc
    i32.const 1
    i32.shr_u
    i32.and
    local.set $arc
    local.get $arc
    local.get $arc
    i32.const 1
    i32.shr_u
    i32.and
    local.set $arc
    local.get $arc
    local.get $arc
    i32.const 1
    i32.shr_u
    i32.and
    local.set $arc
    local.get $arc
    local.get $arc
    i32.const 1
    i32.shr_u
    i32.and
    local.set $arc
    local.get $arc
    local.get $arc
    i32.const 1
    i32.shr_u
    i32.and
    local.set $arc
    local.get $arc
    local.get $arc
    i32.const 1
    i32.shr_u
    i32.and
    local.set $arc
    local.get $arc
    i32.const 65535
    i32.and
    i32.const 0
    i32.ne
  )
  (func $sfm_fast9_scores_f32 (;16;) (export "sfm_fast9_scores_f32") (param $gray_ptr (;0;) i32) (param $width (;1;) i32) (param $height (;2;) i32) (param $threshold (;3;) f64) (param $circle_x_ptr (;4;) i32) (param $circle_y_ptr (;5;) i32) (param $out_scores_ptr (;6;) i32) (result i32)
    (local $total i32)
    (local $idx i32)
    (local $y i32)
    (local $x i32)
    (local $row i32)
    (local $center i32)
    (local $bright i32)
    (local $dark i32)
    (local $contrast i32)
    (local $k i32)
    (local $dx i32)
    (local $dy i32)
    (local $neighbor_idx i32)
    (local $diff i32)
    (local $bright_min i32)
    (local $dark_max i32)
    local.get $width
    i32.const 0
    i32.le_s
    if
      i32.const 0
      return
    end
    local.get $height
    i32.const 0
    i32.le_s
    if
      i32.const 0
      return
    end
    local.get $width
    local.get $height
    i32.mul
    local.set $total
    local.get $threshold
    local.get $threshold
    f64.ne
    if
      i32.const 2147483647
      local.set $bright_min
      i32.const -2147483648
      local.set $dark_max
    else
      local.get $threshold
      f64.floor
      i32.trunc_f64_s
      i32.const 1
      i32.add
      local.set $bright_min
      local.get $threshold
      f64.neg
      f64.ceil
      i32.trunc_f64_s
      i32.const 1
      i32.sub
      local.set $dark_max
    end
    i32.const 0
    local.set $idx
    block $label0
      loop $label1
        local.get $idx
        local.get $total
        i32.ge_u
        br_if $label0
        local.get $out_scores_ptr
        local.get $idx
        i32.const 2
        i32.shl
        i32.add
        f32.const 0.0
        f32.store
        local.get $idx
        i32.const 1
        i32.add
        local.set $idx
        br $label1
      end $label1
    end $label0
    local.get $width
    i32.const 6
    i32.le_s
    if
      local.get $total
      return
    end
    local.get $height
    i32.const 6
    i32.le_s
    if
      local.get $total
      return
    end
    i32.const 3
    local.set $y
    block $label2
      loop $label7
        local.get $y
        local.get $height
        i32.const 3
        i32.sub
        i32.ge_s
        br_if $label2
        local.get $y
        local.get $width
        i32.mul
        local.set $row
        i32.const 3
        local.set $x
        block $label3
          loop $label6
            local.get $x
            local.get $width
            i32.const 3
            i32.sub
            i32.ge_s
            br_if $label3
            local.get $row
            local.get $x
            i32.add
            local.set $idx
            local.get $gray_ptr
            local.get $idx
            i32.add
            i32.load8_u
            local.set $center
            i32.const 0
            local.set $bright
            i32.const 0
            local.set $dark
            i32.const 0
            local.set $contrast
            i32.const 0
            local.set $k
            block $label4
              loop $label5
                local.get $k
                i32.const 16
                i32.ge_u
                br_if $label4
                local.get $circle_x_ptr
                local.get $k
                i32.add
                i32.load8_s
                local.set $dx
                local.get $circle_y_ptr
                local.get $k
                i32.add
                i32.load8_s
                local.set $dy
                local.get $y
                local.get $dy
                i32.add
                local.get $width
                i32.mul
                local.get $x
                i32.add
                local.get $dx
                i32.add
                local.set $neighbor_idx
                local.get $gray_ptr
                local.get $neighbor_idx
                i32.add
                i32.load8_u
                local.get $center
                i32.sub
                local.set $diff
                local.get $diff
                local.get $bright_min
                i32.ge_s
                if
                  local.get $bright
                  i32.const 1
                  local.get $k
                  i32.shl
                  i32.or
                  local.set $bright
                else
                  local.get $diff
                  local.get $dark_max
                  i32.le_s
                  if
                    local.get $dark
                    i32.const 1
                    local.get $k
                    i32.shl
                    i32.or
                    local.set $dark
                  end
                end
                local.get $diff
                i32.const 0
                i32.lt_s
                if
                  local.get $contrast
                  i32.const 0
                  local.get $diff
                  i32.sub
                  i32.add
                  local.set $contrast
                else
                  local.get $contrast
                  local.get $diff
                  i32.add
                  local.set $contrast
                end
                local.get $k
                i32.const 1
                i32.add
                local.set $k
                br $label5
              end $label5
            end $label4
            local.get $bright
            call $sfm_has_fast9_arc
            if
              local.get $out_scores_ptr
              local.get $idx
              i32.const 2
              i32.shl
              i32.add
              local.get $contrast
              f32.convert_i32_u
              f32.store
            else
              local.get $dark
              call $sfm_has_fast9_arc
              if
                local.get $out_scores_ptr
                local.get $idx
                i32.const 2
                i32.shl
                i32.add
                local.get $contrast
                f32.convert_i32_u
                f32.store
              end
            end
            local.get $x
            i32.const 1
            i32.add
            local.set $x
            br $label6
          end $label6
        end $label3
        local.get $y
        i32.const 1
        i32.add
        local.set $y
        br $label7
      end $label7
    end $label2
    local.get $total
  )
  (func $sfm_fast9_scores_offsets_f32 (;17;) (export "sfm_fast9_scores_offsets_f32") (param $gray_ptr (;0;) i32) (param $width (;1;) i32) (param $height (;2;) i32) (param $threshold (;3;) f64) (param $offsets_ptr (;4;) i32) (param $out_scores_ptr (;5;) i32) (result i32)
    (local $total i32)
    (local $idx i32)
    (local $y i32)
    (local $x i32)
    (local $row i32)
    (local $center i32)
    (local $bright i32)
    (local $dark i32)
    (local $contrast i32)
    (local $k i32)
    (local $diff i32)
    (local $bright_min i32)
    (local $dark_max i32)
    local.get $width
    i32.const 0
    i32.le_s
    if
      i32.const 0
      return
    end
    local.get $height
    i32.const 0
    i32.le_s
    if
      i32.const 0
      return
    end
    local.get $width
    local.get $height
    i32.mul
    local.set $total
    local.get $threshold
    local.get $threshold
    f64.ne
    if
      i32.const 2147483647
      local.set $bright_min
      i32.const -2147483648
      local.set $dark_max
    else
      local.get $threshold
      f64.floor
      i32.trunc_f64_s
      i32.const 1
      i32.add
      local.set $bright_min
      local.get $threshold
      f64.neg
      f64.ceil
      i32.trunc_f64_s
      i32.const 1
      i32.sub
      local.set $dark_max
    end
    i32.const 0
    local.set $idx
    block $label0
      loop $label1
        local.get $idx
        local.get $total
        i32.ge_u
        br_if $label0
        local.get $out_scores_ptr
        local.get $idx
        i32.const 2
        i32.shl
        i32.add
        f32.const 0.0
        f32.store
        local.get $idx
        i32.const 1
        i32.add
        local.set $idx
        br $label1
      end $label1
    end $label0
    local.get $width
    i32.const 6
    i32.le_s
    if
      local.get $total
      return
    end
    local.get $height
    i32.const 6
    i32.le_s
    if
      local.get $total
      return
    end
    i32.const 3
    local.set $y
    block $label2
      loop $label7
        local.get $y
        local.get $height
        i32.const 3
        i32.sub
        i32.ge_s
        br_if $label2
        local.get $y
        local.get $width
        i32.mul
        local.set $row
        i32.const 3
        local.set $x
        block $label3
          loop $label6
            local.get $x
            local.get $width
            i32.const 3
            i32.sub
            i32.ge_s
            br_if $label3
            local.get $row
            local.get $x
            i32.add
            local.set $idx
            local.get $gray_ptr
            local.get $idx
            i32.add
            i32.load8_u
            local.set $center
            i32.const 0
            local.set $bright
            i32.const 0
            local.set $dark
            i32.const 0
            local.set $contrast
            i32.const 0
            local.set $k
            block $label4
              loop $label5
                local.get $k
                i32.const 16
                i32.ge_u
                br_if $label4
                local.get $gray_ptr
                local.get $idx
                local.get $offsets_ptr
                local.get $k
                i32.const 2
                i32.shl
                i32.add
                i32.load
                i32.add
                i32.add
                i32.load8_u
                local.get $center
                i32.sub
                local.set $diff
                local.get $diff
                local.get $bright_min
                i32.ge_s
                if
                  local.get $bright
                  i32.const 1
                  local.get $k
                  i32.shl
                  i32.or
                  local.set $bright
                else
                  local.get $diff
                  local.get $dark_max
                  i32.le_s
                  if
                    local.get $dark
                    i32.const 1
                    local.get $k
                    i32.shl
                    i32.or
                    local.set $dark
                  end
                end
                local.get $diff
                i32.const 0
                i32.lt_s
                if
                  local.get $contrast
                  i32.const 0
                  local.get $diff
                  i32.sub
                  i32.add
                  local.set $contrast
                else
                  local.get $contrast
                  local.get $diff
                  i32.add
                  local.set $contrast
                end
                local.get $k
                i32.const 1
                i32.add
                local.set $k
                br $label5
              end $label5
            end $label4
            local.get $bright
            call $sfm_has_fast9_arc
            if
              local.get $out_scores_ptr
              local.get $idx
              i32.const 2
              i32.shl
              i32.add
              local.get $contrast
              f32.convert_i32_u
              f32.store
            else
              local.get $dark
              call $sfm_has_fast9_arc
              if
                local.get $out_scores_ptr
                local.get $idx
                i32.const 2
                i32.shl
                i32.add
                local.get $contrast
                f32.convert_i32_u
                f32.store
              end
            end
            local.get $x
            i32.const 1
            i32.add
            local.set $x
            br $label6
          end $label6
        end $label3
        local.get $y
        i32.const 1
        i32.add
        local.set $y
        br $label7
      end $label7
    end $label2
    local.get $total
  )
  (func $sfm_fast9_select_grid_u16_f32 (;18;) (export "sfm_fast9_select_grid_u16_f32") (param $gray_ptr (;0;) i32) (param $width (;1;) i32) (param $height (;2;) i32) (param $threshold (;3;) f64) (param $scale (;4;) f64) (param $max_features (;5;) i32) (param $circle_x_ptr (;6;) i32) (param $circle_y_ptr (;7;) i32) (param $score_ptr (;8;) i32) (param $out_candidates_ptr (;9;) i32) (param $out_capacity (;10;) i32) (result i32)
    (local $total i32)
    (local $processed i32)
    (local $cols i32)
    (local $rows i32)
    (local $cells i32)
    (local $per_cell i32)
    (local $required i32)
    (local $margin i32)
    (local $cx i32)
    (local $cy i32)
    (local $x0 i32)
    (local $y0 i32)
    (local $x1 i32)
    (local $y1 i32)
    (local $x_limit i32)
    (local $y_limit i32)
    (local $x i32)
    (local $y i32)
    (local $idx i32)
    (local $bucket_base i32)
    (local $bucket_len i32)
    (local $out_count i32)
    (local $insert i32)
    (local $shift i32)
    (local $src i32)
    (local $dst i32)
    (local $s f32)
    local.get $width
    i32.const 0
    i32.le_s
    if
      i32.const -1
      return
    end
    local.get $height
    i32.const 0
    i32.le_s
    if
      i32.const -1
      return
    end
    local.get $width
    i32.const 65535
    i32.gt_u
    if
      i32.const -1
      return
    end
    local.get $height
    i32.const 65535
    i32.gt_u
    if
      i32.const -1
      return
    end
    local.get $max_features
    i32.const 0
    i32.le_s
    if
      i32.const 0
      return
    end
    local.get $scale
    f64.const 0.0
    f64.le
    if
      i32.const -1
      return
    end
    local.get $width
    local.get $height
    i32.mul
    local.set $total
    local.get $circle_y_ptr
    i32.eqz
    if
      local.get $gray_ptr
      local.get $width
      local.get $height
      local.get $threshold
      local.get $circle_x_ptr
      local.get $score_ptr
      call $sfm_fast9_scores_offsets_f32
      local.set $processed
    else
      local.get $gray_ptr
      local.get $width
      local.get $height
      local.get $threshold
      local.get $circle_x_ptr
      local.get $circle_y_ptr
      local.get $score_ptr
      call $sfm_fast9_scores_f32
      local.set $processed
    end
    local.get $processed
    local.get $total
    i32.ne
    if
      i32.const -1
      return
    end
    local.get $width
    i32.const 23
    i32.add
    i32.const 24
    i32.div_u
    local.set $cols
    local.get $height
    i32.const 23
    i32.add
    i32.const 24
    i32.div_u
    local.set $rows
    local.get $cols
    local.get $rows
    i32.mul
    local.set $cells
    local.get $cells
    i32.const 0
    i32.eq
    if
      i32.const 0
      return
    end
    local.get $max_features
    local.get $cells
    i32.add
    i32.const 1
    i32.sub
    local.get $cells
    i32.div_u
    local.set $per_cell
    local.get $per_cell
    i32.const 2
    i32.lt_u
    if
      i32.const 2
      local.set $per_cell
    end
    local.get $cells
    local.get $per_cell
    i32.mul
    local.set $required
    local.get $required
    local.get $out_capacity
    i32.gt_u
    if
      i32.const -1
      return
    end
    f64.const 16
    local.get $scale
    f64.div
    f64.ceil
    i32.trunc_f64_s
    local.set $margin
    local.get $margin
    i32.const 3
    i32.lt_s
    if
      i32.const 3
      local.set $margin
    end
    i32.const 0
    local.set $out_count
    i32.const 0
    local.set $cy
    block $label0
      loop $label12
        local.get $cy
        local.get $rows
        i32.ge_u
        br_if $label0
        i32.const 0
        local.set $cx
        block $label1
          loop $label2
            local.get $cx
            local.get $cols
            i32.ge_u
            br_if $label1
            local.get $out_candidates_ptr
            local.get $out_count
            i32.const 3
            i32.shl
            i32.add
            local.set $bucket_base
            i32.const 0
            local.set $bucket_len
            local.get $cx
            i32.const 24
            i32.mul
            local.set $x0
            local.get $x0
            local.get $margin
            i32.lt_s
            if
              local.get $margin
              local.set $x0
            end
            local.get $cy
            i32.const 24
            i32.mul
            local.set $y0
            local.get $y0
            local.get $margin
            i32.lt_s
            if
              local.get $margin
              local.set $y0
            end
            local.get $width
            local.get $margin
            i32.sub
            local.set $x_limit
            local.get $height
            local.get $margin
            i32.sub
            local.set $y_limit
            local.get $cx
            i32.const 1
            i32.add
            i32.const 24
            i32.mul
            local.set $x1
            local.get $x1
            local.get $x_limit
            i32.gt_s
            if
              local.get $x_limit
              local.set $x1
            end
            local.get $cy
            i32.const 1
            i32.add
            i32.const 24
            i32.mul
            local.set $y1
            local.get $y1
            local.get $y_limit
            i32.gt_s
            if
              local.get $y_limit
              local.set $y1
            end
            local.get $x1
            local.get $x0
            i32.le_s
            if
              local.get $cx
              i32.const 1
              i32.add
              local.set $cx
              br $label2
            end
            local.get $y1
            local.get $y0
            i32.le_s
            if
              local.get $cx
              i32.const 1
              i32.add
              local.set $cx
              br $label2
            end
            local.get $y0
            local.set $y
            block $label3
              loop $label11
                local.get $y
                local.get $y1
                i32.ge_s
                br_if $label3
                local.get $x0
                local.set $x
                block $label4
                  loop $label10
                    local.get $x
                    local.get $x1
                    i32.ge_s
                    br_if $label4
                    block $label5
                      local.get $y
                      local.get $width
                      i32.mul
                      local.get $x
                      i32.add
                      local.set $idx
                      local.get $score_ptr
                      local.get $idx
                      i32.const 2
                      i32.shl
                      i32.add
                      f32.load
                      local.set $s
                      local.get $s
                      f32.const 0.0
                      f32.le
                      br_if $label5
                      local.get $bucket_len
                      local.get $per_cell
                      i32.ge_u
                      if
                        local.get $s
                        local.get $bucket_base
                        local.get $bucket_len
                        i32.const 1
                        i32.sub
                        i32.const 3
                        i32.shl
                        i32.add
                        f32.load offset=4
                        f32.le
                        br_if $label5
                      end
                      local.get $s
                      local.get $score_ptr
                      local.get $idx
                      i32.const 1
                      i32.sub
                      i32.const 2
                      i32.shl
                      i32.add
                      f32.load
                      f32.lt
                      br_if $label5
                      local.get $s
                      local.get $score_ptr
                      local.get $idx
                      i32.const 1
                      i32.add
                      i32.const 2
                      i32.shl
                      i32.add
                      f32.load
                      f32.lt
                      br_if $label5
                      local.get $s
                      local.get $score_ptr
                      local.get $idx
                      local.get $width
                      i32.sub
                      i32.const 2
                      i32.shl
                      i32.add
                      f32.load
                      f32.lt
                      br_if $label5
                      local.get $s
                      local.get $score_ptr
                      local.get $idx
                      local.get $width
                      i32.add
                      i32.const 2
                      i32.shl
                      i32.add
                      f32.load
                      f32.lt
                      br_if $label5
                      i32.const 0
                      local.set $insert
                      block $label6
                        loop $label7
                          local.get $insert
                          local.get $bucket_len
                          i32.ge_u
                          br_if $label6
                          local.get $bucket_base
                          local.get $insert
                          i32.const 3
                          i32.shl
                          i32.add
                          f32.load offset=4
                          local.get $s
                          f32.gt
                          i32.eqz
                          br_if $label6
                          local.get $insert
                          i32.const 1
                          i32.add
                          local.set $insert
                          br $label7
                        end $label7
                      end $label6
                      local.get $insert
                      local.get $per_cell
                      i32.ge_u
                      br_if $label5
                      local.get $bucket_len
                      local.get $per_cell
                      i32.lt_u
                      if
                        local.get $bucket_len
                        local.set $shift
                        local.get $bucket_len
                        i32.const 1
                        i32.add
                        local.set $bucket_len
                      else
                        local.get $per_cell
                        i32.const 1
                        i32.sub
                        local.set $shift
                      end
                      block $label8
                        loop $label9
                          local.get $shift
                          local.get $insert
                          i32.le_u
                          br_if $label8
                          local.get $bucket_base
                          local.get $shift
                          i32.const 3
                          i32.shl
                          i32.add
                          local.set $dst
                          local.get $bucket_base
                          local.get $shift
                          i32.const 1
                          i32.sub
                          i32.const 3
                          i32.shl
                          i32.add
                          local.set $src
                          local.get $dst
                          local.get $src
                          i32.load16_u
                          i32.store16
                          local.get $dst
                          local.get $src
                          i32.load16_u offset=2
                          i32.store16 offset=2
                          local.get $dst
                          local.get $src
                          f32.load offset=4
                          f32.store offset=4
                          local.get $shift
                          i32.const 1
                          i32.sub
                          local.set $shift
                          br $label9
                        end $label9
                      end $label8
                      local.get $bucket_base
                      local.get $insert
                      i32.const 3
                      i32.shl
                      i32.add
                      local.set $dst
                      local.get $dst
                      local.get $x
                      i32.store16
                      local.get $dst
                      local.get $y
                      i32.store16 offset=2
                      local.get $dst
                      local.get $s
                      f32.store offset=4
                    end $label5
                    local.get $x
                    i32.const 1
                    i32.add
                    local.set $x
                    br $label10
                  end $label10
                end $label4
                local.get $y
                i32.const 1
                i32.add
                local.set $y
                br $label11
              end $label11
            end $label3
            local.get $out_count
            local.get $bucket_len
            i32.add
            local.set $out_count
            local.get $cx
            i32.const 1
            i32.add
            local.set $cx
            br $label2
          end $label2
        end $label1
        local.get $cy
        i32.const 1
        i32.add
        local.set $cy
        br $label12
      end $label12
    end $label0
    local.get $out_count
  )
  (func $sfm_fast9_write_score_row_offsets_i32 (;19;) (param $gray_ptr (;0;) i32) (param $width (;1;) i32) (param $height (;2;) i32) (param $y (;3;) i32) (param $offsets_ptr (;4;) i32) (param $bright_min (;5;) i32) (param $dark_max (;6;) i32) (param $out_row_ptr (;7;) i32)
    (local $x i32)
    (local $idx i32)
    (local $s i32)
    (local $center i32)
    (local $bright i32)
    (local $dark i32)
    (local $contrast i32)
    (local $k i32)
    (local $diff i32)
    i32.const 0
    local.set $x
    block $label0
      loop $label3
        local.get $x
        local.get $width
        i32.ge_u
        br_if $label0
        i32.const 0
        local.set $s
        local.get $y
        i32.const 3
        i32.ge_s
        local.get $y
        local.get $height
        i32.const 3
        i32.sub
        i32.lt_s
        i32.and
        local.get $x
        i32.const 3
        i32.ge_s
        i32.and
        local.get $x
        local.get $width
        i32.const 3
        i32.sub
        i32.lt_s
        i32.and
        if
          local.get $y
          local.get $width
          i32.mul
          local.get $x
          i32.add
          local.set $idx
          local.get $gray_ptr
          local.get $idx
          i32.add
          i32.load8_u
          local.set $center
          i32.const 0
          local.set $bright
          i32.const 0
          local.set $dark
          i32.const 0
          local.set $contrast
          i32.const 0
          local.set $k
          block $label1
            loop $label2
              local.get $k
              i32.const 16
              i32.ge_u
              br_if $label1
              local.get $gray_ptr
              local.get $idx
              local.get $offsets_ptr
              local.get $k
              i32.const 2
              i32.shl
              i32.add
              i32.load
              i32.add
              i32.add
              i32.load8_u
              local.get $center
              i32.sub
              local.set $diff
              local.get $diff
              local.get $bright_min
              i32.ge_s
              if
                local.get $bright
                i32.const 1
                local.get $k
                i32.shl
                i32.or
                local.set $bright
              else
                local.get $diff
                local.get $dark_max
                i32.le_s
                if
                  local.get $dark
                  i32.const 1
                  local.get $k
                  i32.shl
                  i32.or
                  local.set $dark
                end
              end
              local.get $diff
              i32.const 0
              i32.lt_s
              if
                local.get $contrast
                i32.const 0
                local.get $diff
                i32.sub
                i32.add
                local.set $contrast
              else
                local.get $contrast
                local.get $diff
                i32.add
                local.set $contrast
              end
              local.get $k
              i32.const 1
              i32.add
              local.set $k
              br $label2
            end $label2
          end $label1
          local.get $bright
          call $sfm_has_fast9_arc
          if
            local.get $contrast
            local.set $s
          else
            local.get $dark
            call $sfm_has_fast9_arc
            if
              local.get $contrast
              local.set $s
            end
          end
        end
        local.get $out_row_ptr
        local.get $x
        i32.const 2
        i32.shl
        i32.add
        local.get $s
        i32.store
        local.get $x
        i32.const 1
        i32.add
        local.set $x
        br $label3
      end $label3
    end $label0
  )
  (func $sfm_fast9_select_grid_fused_rows_u16_f32 (;20;) (param $gray_ptr (;0;) i32) (param $width (;1;) i32) (param $height (;2;) i32) (param $threshold (;3;) f64) (param $scale (;4;) f64) (param $max_features (;5;) i32) (param $offsets_ptr (;6;) i32) (param $out_candidates_ptr (;7;) i32) (param $out_capacity (;8;) i32) (result i32)
    (local $cols i32)
    (local $rows i32)
    (local $cells i32)
    (local $per_cell i32)
    (local $required i32)
    (local $margin i32)
    (local $x_limit i32)
    (local $y_limit i32)
    (local $bucket_lens_ptr i32)
    (local $row_bytes i32)
    (local $prev_row_ptr i32)
    (local $curr_row_ptr i32)
    (local $next_row_ptr i32)
    (local $tmp_row_ptr i32)
    (local $x i32)
    (local $y i32)
    (local $cell_idx i32)
    (local $bucket_base i32)
    (local $bucket_len i32)
    (local $out_count i32)
    (local $insert i32)
    (local $shift i32)
    (local $copy i32)
    (local $src i32)
    (local $dst i32)
    (local $s i32)
    (local $sf f32)
    (local $bright_min i32)
    (local $dark_max i32)
    local.get $width
    i32.const 0
    i32.le_s
    if
      i32.const -1
      return
    end
    local.get $height
    i32.const 0
    i32.le_s
    if
      i32.const -1
      return
    end
    local.get $width
    i32.const 65535
    i32.gt_u
    if
      i32.const -1
      return
    end
    local.get $height
    i32.const 65535
    i32.gt_u
    if
      i32.const -1
      return
    end
    local.get $max_features
    i32.const 0
    i32.le_s
    if
      i32.const 0
      return
    end
    local.get $scale
    f64.const 0.0
    f64.le
    if
      i32.const -1
      return
    end
    local.get $threshold
    local.get $threshold
    f64.ne
    if
      i32.const 2147483647
      local.set $bright_min
      i32.const -2147483648
      local.set $dark_max
    else
      local.get $threshold
      f64.floor
      i32.trunc_f64_s
      i32.const 1
      i32.add
      local.set $bright_min
      local.get $threshold
      f64.neg
      f64.ceil
      i32.trunc_f64_s
      i32.const 1
      i32.sub
      local.set $dark_max
    end
    local.get $width
    i32.const 23
    i32.add
    i32.const 24
    i32.div_u
    local.set $cols
    local.get $height
    i32.const 23
    i32.add
    i32.const 24
    i32.div_u
    local.set $rows
    local.get $cols
    local.get $rows
    i32.mul
    local.set $cells
    local.get $cells
    i32.const 0
    i32.eq
    if
      i32.const 0
      return
    end
    local.get $max_features
    local.get $cells
    i32.add
    i32.const 1
    i32.sub
    local.get $cells
    i32.div_u
    local.set $per_cell
    local.get $per_cell
    i32.const 2
    i32.lt_u
    if
      i32.const 2
      local.set $per_cell
    end
    local.get $cells
    local.get $per_cell
    i32.mul
    local.set $required
    local.get $required
    local.get $out_capacity
    i32.gt_u
    if
      i32.const -1
      return
    end
    f64.const 16
    local.get $scale
    f64.div
    f64.ceil
    i32.trunc_f64_s
    local.set $margin
    local.get $margin
    i32.const 3
    i32.lt_s
    if
      i32.const 3
      local.set $margin
    end
    local.get $width
    local.get $margin
    i32.sub
    local.set $x_limit
    local.get $height
    local.get $margin
    i32.sub
    local.set $y_limit
    local.get $x_limit
    local.get $margin
    i32.le_s
    if
      i32.const 0
      return
    end
    local.get $y_limit
    local.get $margin
    i32.le_s
    if
      i32.const 0
      return
    end
    local.get $cells
    i32.const 2
    i32.shl
    i32.const 16
    call $sfm_alloc
    local.set $bucket_lens_ptr
    local.get $width
    i32.const 2
    i32.shl
    local.set $row_bytes
    local.get $row_bytes
    i32.const 16
    call $sfm_alloc
    local.set $prev_row_ptr
    local.get $row_bytes
    i32.const 16
    call $sfm_alloc
    local.set $curr_row_ptr
    local.get $row_bytes
    i32.const 16
    call $sfm_alloc
    local.set $next_row_ptr
    i32.const 0
    local.set $cell_idx
    block $label0
      loop $label1
        local.get $cell_idx
        local.get $cells
        i32.ge_u
        br_if $label0
        local.get $bucket_lens_ptr
        local.get $cell_idx
        i32.const 2
        i32.shl
        i32.add
        i32.const 0
        i32.store
        local.get $cell_idx
        i32.const 1
        i32.add
        local.set $cell_idx
        br $label1
      end $label1
    end $label0
    local.get $gray_ptr
    local.get $width
    local.get $height
    local.get $margin
    i32.const 1
    i32.sub
    local.get $offsets_ptr
    local.get $bright_min
    local.get $dark_max
    local.get $prev_row_ptr
    call $sfm_fast9_write_score_row_offsets_i32
    local.get $gray_ptr
    local.get $width
    local.get $height
    local.get $margin
    local.get $offsets_ptr
    local.get $bright_min
    local.get $dark_max
    local.get $curr_row_ptr
    call $sfm_fast9_write_score_row_offsets_i32
    local.get $gray_ptr
    local.get $width
    local.get $height
    local.get $margin
    i32.const 1
    i32.add
    local.get $offsets_ptr
    local.get $bright_min
    local.get $dark_max
    local.get $next_row_ptr
    call $sfm_fast9_write_score_row_offsets_i32
    local.get $margin
    local.set $y
    block $label2
      loop $label10
        local.get $y
        local.get $y_limit
        i32.ge_s
        br_if $label2
        local.get $margin
        local.set $x
        block $label3
          loop $label9
            local.get $x
            local.get $x_limit
            i32.ge_s
            br_if $label3
            block $label4
              local.get $curr_row_ptr
              local.get $x
              i32.const 2
              i32.shl
              i32.add
              i32.load
              local.tee $s
              i32.eqz
              br_if $label4
              local.get $s
              f32.convert_i32_u
              local.set $sf
              local.get $y
              i32.const 24
              i32.div_u
              local.get $cols
              i32.mul
              local.get $x
              i32.const 24
              i32.div_u
              i32.add
              local.set $cell_idx
              local.get $bucket_lens_ptr
              local.get $cell_idx
              i32.const 2
              i32.shl
              i32.add
              i32.load
              local.set $bucket_len
              local.get $out_candidates_ptr
              local.get $cell_idx
              local.get $per_cell
              i32.mul
              i32.const 3
              i32.shl
              i32.add
              local.set $bucket_base
              local.get $bucket_len
              local.get $per_cell
              i32.ge_u
              if
                local.get $sf
                local.get $bucket_base
                local.get $bucket_len
                i32.const 1
                i32.sub
                i32.const 3
                i32.shl
                i32.add
                f32.load offset=4
                f32.le
                br_if $label4
              end
              local.get $s
              local.get $curr_row_ptr
              local.get $x
              i32.const 1
              i32.sub
              i32.const 2
              i32.shl
              i32.add
              i32.load
              i32.lt_u
              br_if $label4
              local.get $s
              local.get $curr_row_ptr
              local.get $x
              i32.const 1
              i32.add
              i32.const 2
              i32.shl
              i32.add
              i32.load
              i32.lt_u
              br_if $label4
              local.get $s
              local.get $prev_row_ptr
              local.get $x
              i32.const 2
              i32.shl
              i32.add
              i32.load
              i32.lt_u
              br_if $label4
              local.get $s
              local.get $next_row_ptr
              local.get $x
              i32.const 2
              i32.shl
              i32.add
              i32.load
              i32.lt_u
              br_if $label4
              i32.const 0
              local.set $insert
              block $label5
                loop $label6
                  local.get $insert
                  local.get $bucket_len
                  i32.ge_u
                  br_if $label5
                  local.get $bucket_base
                  local.get $insert
                  i32.const 3
                  i32.shl
                  i32.add
                  f32.load offset=4
                  local.get $sf
                  f32.gt
                  i32.eqz
                  br_if $label5
                  local.get $insert
                  i32.const 1
                  i32.add
                  local.set $insert
                  br $label6
                end $label6
              end $label5
              local.get $insert
              local.get $per_cell
              i32.ge_u
              br_if $label4
              local.get $bucket_len
              local.get $per_cell
              i32.lt_u
              if
                local.get $bucket_len
                local.set $shift
                local.get $bucket_len
                i32.const 1
                i32.add
                local.set $bucket_len
              else
                local.get $per_cell
                i32.const 1
                i32.sub
                local.set $shift
              end
              block $label7
                loop $label8
                  local.get $shift
                  local.get $insert
                  i32.le_u
                  br_if $label7
                  local.get $bucket_base
                  local.get $shift
                  i32.const 3
                  i32.shl
                  i32.add
                  local.set $dst
                  local.get $bucket_base
                  local.get $shift
                  i32.const 1
                  i32.sub
                  i32.const 3
                  i32.shl
                  i32.add
                  local.set $src
                  local.get $dst
                  local.get $src
                  i32.load16_u
                  i32.store16
                  local.get $dst
                  local.get $src
                  i32.load16_u offset=2
                  i32.store16 offset=2
                  local.get $dst
                  local.get $src
                  f32.load offset=4
                  f32.store offset=4
                  local.get $shift
                  i32.const 1
                  i32.sub
                  local.set $shift
                  br $label8
                end $label8
              end $label7
              local.get $bucket_base
              local.get $insert
              i32.const 3
              i32.shl
              i32.add
              local.set $dst
              local.get $dst
              local.get $x
              i32.store16
              local.get $dst
              local.get $y
              i32.store16 offset=2
              local.get $dst
              local.get $sf
              f32.store offset=4
              local.get $bucket_lens_ptr
              local.get $cell_idx
              i32.const 2
              i32.shl
              i32.add
              local.get $bucket_len
              i32.store
            end $label4
            local.get $x
            i32.const 1
            i32.add
            local.set $x
            br $label9
          end $label9
        end $label3
        local.get $prev_row_ptr
        local.set $tmp_row_ptr
        local.get $curr_row_ptr
        local.set $prev_row_ptr
        local.get $next_row_ptr
        local.set $curr_row_ptr
        local.get $tmp_row_ptr
        local.set $next_row_ptr
        local.get $gray_ptr
        local.get $width
        local.get $height
        local.get $y
        i32.const 2
        i32.add
        local.get $offsets_ptr
        local.get $bright_min
        local.get $dark_max
        local.get $next_row_ptr
        call $sfm_fast9_write_score_row_offsets_i32
        local.get $y
        i32.const 1
        i32.add
        local.set $y
        br $label10
      end $label10
    end $label2
    i32.const 0
    local.set $out_count
    i32.const 0
    local.set $cell_idx
    block $label11
      loop $label14
        local.get $cell_idx
        local.get $cells
        i32.ge_u
        br_if $label11
        local.get $bucket_lens_ptr
        local.get $cell_idx
        i32.const 2
        i32.shl
        i32.add
        i32.load
        local.set $bucket_len
        local.get $out_candidates_ptr
        local.get $cell_idx
        local.get $per_cell
        i32.mul
        i32.const 3
        i32.shl
        i32.add
        local.set $bucket_base
        i32.const 0
        local.set $copy
        block $label12
          loop $label13
            local.get $copy
            local.get $bucket_len
            i32.ge_u
            br_if $label12
            local.get $bucket_base
            local.get $copy
            i32.const 3
            i32.shl
            i32.add
            local.set $src
            local.get $out_candidates_ptr
            local.get $out_count
            i32.const 3
            i32.shl
            i32.add
            local.set $dst
            local.get $dst
            local.get $src
            i32.load16_u
            i32.store16
            local.get $dst
            local.get $src
            i32.load16_u offset=2
            i32.store16 offset=2
            local.get $dst
            local.get $src
            f32.load offset=4
            f32.store offset=4
            local.get $out_count
            i32.const 1
            i32.add
            local.set $out_count
            local.get $copy
            i32.const 1
            i32.add
            local.set $copy
            br $label13
          end $label13
        end $label12
        local.get $cell_idx
        i32.const 1
        i32.add
        local.set $cell_idx
        br $label14
      end $label14
    end $label11
    local.get $out_count
  )
  (func $sfm_fast9_select_grid_fused_u16_f32 (;21;) (export "sfm_fast9_select_grid_fused_u16_f32") (param $gray_ptr (;0;) i32) (param $width (;1;) i32) (param $height (;2;) i32) (param $threshold (;3;) f64) (param $scale (;4;) f64) (param $max_features (;5;) i32) (param $offsets_ptr (;6;) i32) (param $out_candidates_ptr (;7;) i32) (param $out_capacity (;8;) i32) (result i32)
    local.get $gray_ptr
    local.get $width
    local.get $height
    local.get $threshold
    local.get $scale
    local.get $max_features
    local.get $offsets_ptr
    local.get $out_candidates_ptr
    local.get $out_capacity
    call $sfm_fast9_select_grid_fused_rows_u16_f32
  )
  (func $sfm_write_oriented_brief_u32 (;22;) (export "sfm_write_oriented_brief_u32") (param $gray_ptr (;0;) i32) (param $width (;1;) i32) (param $height (;2;) i32) (param $feature_params_ptr (;3;) i32) (param $feature_count (;4;) i32) (param $pairs_ptr (;5;) i32) (param $out_desc_ptr (;6;) i32) (result i32)
    (local $feature i32)
    (local $word i32)
    (local $bit i32)
    (local $param_ptr i32)
    (local $pair_ptr i32)
    (local $desc_ptr i32)
    (local $ax i32)
    (local $ay i32)
    (local $bx i32)
    (local $by i32)
    (local $av i32)
    (local $bv i32)
    (local $x f64)
    (local $y f64)
    (local $sample_scale f64)
    (local $cos f64)
    (local $sin f64)
    (local $p f64)
    (local $q f64)
    (local $r f64)
    (local $s f64)
    i32.const 0
    local.set $feature
    block $label0
      loop $label5
        local.get $feature
        local.get $feature_count
        i32.ge_u
        br_if $label0
        local.get $feature_params_ptr
        local.get $feature
        i32.const 40
        i32.mul
        i32.add
        local.set $param_ptr
        local.get $out_desc_ptr
        local.get $feature
        i32.const 5
        i32.shl
        i32.add
        local.set $desc_ptr
        local.get $param_ptr
        f64.load
        local.set $x
        local.get $param_ptr
        f64.load offset=8
        local.set $y
        local.get $param_ptr
        f64.load offset=16
        local.set $sample_scale
        local.get $param_ptr
        f64.load offset=24
        local.set $cos
        local.get $param_ptr
        f64.load offset=32
        local.set $sin
        i32.const 0
        local.set $word
        block $label1
          loop $label2
            local.get $word
            i32.const 8
            i32.ge_u
            br_if $label1
            local.get $desc_ptr
            local.get $word
            i32.const 2
            i32.shl
            i32.add
            i32.const 0
            i32.store
            local.get $word
            i32.const 1
            i32.add
            local.set $word
            br $label2
          end $label2
        end $label1
        i32.const 0
        local.set $bit
        block $label3
          loop $label4
            local.get $bit
            i32.const 256
            i32.ge_u
            br_if $label3
            local.get $pairs_ptr
            local.get $bit
            i32.const 2
            i32.shl
            i32.add
            local.set $pair_ptr
            local.get $pair_ptr
            i32.load8_s
            f64.convert_i32_s
            local.set $p
            local.get $pair_ptr
            i32.const 1
            i32.add
            i32.load8_s
            f64.convert_i32_s
            local.set $q
            local.get $pair_ptr
            i32.const 2
            i32.add
            i32.load8_s
            f64.convert_i32_s
            local.set $r
            local.get $pair_ptr
            i32.const 3
            i32.add
            i32.load8_s
            f64.convert_i32_s
            local.set $s
            local.get $x
            local.get $sample_scale
            local.get $cos
            local.get $p
            f64.mul
            local.get $sin
            local.get $q
            f64.mul
            f64.sub
            f64.mul
            f64.add
            i32.const 0
            local.get $width
            i32.const 1
            i32.sub
            call $round_clamp_i32
            local.set $ax
            local.get $y
            local.get $sample_scale
            local.get $sin
            local.get $p
            f64.mul
            local.get $cos
            local.get $q
            f64.mul
            f64.add
            f64.mul
            f64.add
            i32.const 0
            local.get $height
            i32.const 1
            i32.sub
            call $round_clamp_i32
            local.set $ay
            local.get $x
            local.get $sample_scale
            local.get $cos
            local.get $r
            f64.mul
            local.get $sin
            local.get $s
            f64.mul
            f64.sub
            f64.mul
            f64.add
            i32.const 0
            local.get $width
            i32.const 1
            i32.sub
            call $round_clamp_i32
            local.set $bx
            local.get $y
            local.get $sample_scale
            local.get $sin
            local.get $r
            f64.mul
            local.get $cos
            local.get $s
            f64.mul
            f64.add
            f64.mul
            f64.add
            i32.const 0
            local.get $height
            i32.const 1
            i32.sub
            call $round_clamp_i32
            local.set $by
            local.get $gray_ptr
            local.get $ay
            local.get $width
            i32.mul
            local.get $ax
            i32.add
            i32.add
            i32.load8_u
            local.set $av
            local.get $gray_ptr
            local.get $by
            local.get $width
            i32.mul
            local.get $bx
            i32.add
            i32.add
            i32.load8_u
            local.set $bv
            local.get $av
            local.get $bv
            i32.lt_u
            if
              local.get $desc_ptr
              local.get $bit
              i32.const 5
              i32.shr_u
              i32.const 2
              i32.shl
              i32.add
              local.get $desc_ptr
              local.get $bit
              i32.const 5
              i32.shr_u
              i32.const 2
              i32.shl
              i32.add
              i32.load
              i32.const 1
              local.get $bit
              i32.const 31
              i32.and
              i32.shl
              i32.or
              i32.store
            end
            local.get $bit
            i32.const 1
            i32.add
            local.set $bit
            br $label4
          end $label4
        end $label3
        local.get $feature
        i32.const 1
        i32.add
        local.set $feature
        br $label5
      end $label5
    end $label0
    local.get $feature_count
  )
  (func $sfm_compose_fivepoint_e_f64 (;23;) (param $chart_ptr (;0;) i32) (param $v0 (;1;) f64) (param $v1 (;2;) f64) (param $v2 (;3;) f64) (param $out_ptr (;4;) i32) (result i32)
    (local $i i32)
    (local $offset i32)
    (local $value f64)
    (local $norm f64)
    f64.const 0.0
    local.set $norm
    i32.const 0
    local.set $i
    block $label0
      loop $label1
        local.get $i
        i32.const 9
        i32.ge_u
        br_if $label0
        local.get $i
        i32.const 3
        i32.shl
        local.set $offset
        local.get $chart_ptr
        local.get $offset
        i32.add
        f64.load
        local.get $v0
        local.get $chart_ptr
        i32.const 72
        i32.add
        local.get $offset
        i32.add
        f64.load
        f64.mul
        f64.add
        local.get $v1
        local.get $chart_ptr
        i32.const 144
        i32.add
        local.get $offset
        i32.add
        f64.load
        f64.mul
        f64.add
        local.get $v2
        local.get $chart_ptr
        i32.const 216
        i32.add
        local.get $offset
        i32.add
        f64.load
        f64.mul
        f64.add
        local.set $value
        local.get $out_ptr
        local.get $offset
        i32.add
        local.get $value
        f64.store
        local.get $norm
        local.get $value
        local.get $value
        f64.mul
        f64.add
        local.set $norm
        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $label1
      end $label1
    end $label0
    local.get $norm
    f64.sqrt
    local.tee $norm
    f64.const 1e-12
    f64.le
    if
      i32.const 0
      return
    end
    i32.const 0
    local.set $i
    block $label2
      loop $label3
        local.get $i
        i32.const 9
        i32.ge_u
        br_if $label2
        local.get $i
        i32.const 3
        i32.shl
        local.set $offset
        local.get $out_ptr
        local.get $offset
        i32.add
        local.get $out_ptr
        local.get $offset
        i32.add
        f64.load
        local.get $norm
        f64.div
        f64.store
        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $label3
      end $label3
    end $label2
    i32.const 1
  )
  (func $sfm_det3_f64 (;24;) (param $m (;0;) i32) (result f64)
    (local $a00 f64)
    (local $a01 f64)
    (local $a02 f64)
    (local $a10 f64)
    (local $a11 f64)
    (local $a12 f64)
    (local $a20 f64)
    (local $a21 f64)
    (local $a22 f64)
    local.get $m
    f64.load
    local.set $a00
    local.get $m
    f64.load offset=8
    local.set $a01
    local.get $m
    f64.load offset=16
    local.set $a02
    local.get $m
    f64.load offset=24
    local.set $a10
    local.get $m
    f64.load offset=32
    local.set $a11
    local.get $m
    f64.load offset=40
    local.set $a12
    local.get $m
    f64.load offset=48
    local.set $a20
    local.get $m
    f64.load offset=56
    local.set $a21
    local.get $m
    f64.load offset=64
    local.set $a22
    local.get $a00
    local.get $a11
    local.get $a22
    f64.mul
    local.get $a12
    local.get $a21
    f64.mul
    f64.sub
    f64.mul
    local.get $a01
    local.get $a10
    local.get $a22
    f64.mul
    local.get $a12
    local.get $a20
    f64.mul
    f64.sub
    f64.mul
    f64.sub
    local.get $a02
    local.get $a10
    local.get $a21
    f64.mul
    local.get $a11
    local.get $a20
    f64.mul
    f64.sub
    f64.mul
    f64.add
  )
  (func $sfm_fivepoint_residual_f64 (;25;) (param $chart_ptr (;0;) i32) (param $v0 (;1;) f64) (param $v1 (;2;) f64) (param $v2 (;3;) f64) (param $res_ptr (;4;) i32) (param $work_ptr (;5;) i32) (result i32)
    (local $e_ptr i32)
    (local $ee_ptr i32)
    (local $r i32)
    (local $c i32)
    (local $k i32)
    (local $idx i32)
    (local $sum f64)
    (local $trace f64)
    (local $e_value f64)
    local.get $work_ptr
    local.set $e_ptr
    local.get $work_ptr
    i32.const 72
    i32.add
    local.set $ee_ptr
    local.get $chart_ptr
    local.get $v0
    local.get $v1
    local.get $v2
    local.get $e_ptr
    call $sfm_compose_fivepoint_e_f64
    i32.eqz
    if
      i32.const 0
      return
    end
    i32.const 0
    local.set $r
    block $label0
      loop $label5
        local.get $r
        i32.const 3
        i32.ge_u
        br_if $label0
        i32.const 0
        local.set $c
        block $label1
          loop $label4
            local.get $c
            i32.const 3
            i32.ge_u
            br_if $label1
            f64.const 0.0
            local.set $sum
            i32.const 0
            local.set $k
            block $label2
              loop $label3
                local.get $k
                i32.const 3
                i32.ge_u
                br_if $label2
                local.get $sum
                local.get $e_ptr
                local.get $r
                i32.const 3
                i32.mul
                local.get $k
                i32.add
                i32.const 3
                i32.shl
                i32.add
                f64.load
                local.get $e_ptr
                local.get $c
                i32.const 3
                i32.mul
                local.get $k
                i32.add
                i32.const 3
                i32.shl
                i32.add
                f64.load
                f64.mul
                f64.add
                local.set $sum
                local.get $k
                i32.const 1
                i32.add
                local.set $k
                br $label3
              end $label3
            end $label2
            local.get $ee_ptr
            local.get $r
            i32.const 3
            i32.mul
            local.get $c
            i32.add
            i32.const 3
            i32.shl
            i32.add
            local.get $sum
            f64.store
            local.get $c
            i32.const 1
            i32.add
            local.set $c
            br $label4
          end $label4
        end $label1
        local.get $r
        i32.const 1
        i32.add
        local.set $r
        br $label5
      end $label5
    end $label0
    local.get $ee_ptr
    f64.load
    local.get $ee_ptr
    f64.load offset=32
    f64.add
    local.get $ee_ptr
    f64.load offset=64
    f64.add
    local.set $trace
    i32.const 0
    local.set $r
    block $label6
      loop $label11
        local.get $r
        i32.const 3
        i32.ge_u
        br_if $label6
        i32.const 0
        local.set $c
        block $label7
          loop $label10
            local.get $c
            i32.const 3
            i32.ge_u
            br_if $label7
            f64.const 0.0
            local.set $sum
            i32.const 0
            local.set $k
            block $label8
              loop $label9
                local.get $k
                i32.const 3
                i32.ge_u
                br_if $label8
                local.get $sum
                local.get $ee_ptr
                local.get $r
                i32.const 3
                i32.mul
                local.get $k
                i32.add
                i32.const 3
                i32.shl
                i32.add
                f64.load
                local.get $e_ptr
                local.get $k
                i32.const 3
                i32.mul
                local.get $c
                i32.add
                i32.const 3
                i32.shl
                i32.add
                f64.load
                f64.mul
                f64.add
                local.set $sum
                local.get $k
                i32.const 1
                i32.add
                local.set $k
                br $label9
              end $label9
            end $label8
            local.get $r
            i32.const 3
            i32.mul
            local.get $c
            i32.add
            local.tee $idx
            i32.const 3
            i32.shl
            local.set $idx
            local.get $e_ptr
            local.get $idx
            i32.add
            f64.load
            local.set $e_value
            local.get $res_ptr
            local.get $idx
            i32.add
            f64.const 2
            local.get $sum
            f64.mul
            local.get $trace
            local.get $e_value
            f64.mul
            f64.sub
            f64.store
            local.get $c
            i32.const 1
            i32.add
            local.set $c
            br $label10
          end $label10
        end $label7
        local.get $r
        i32.const 1
        i32.add
        local.set $r
        br $label11
      end $label11
    end $label6
    local.get $res_ptr
    i32.const 72
    i32.add
    local.get $e_ptr
    call $sfm_det3_f64
    f64.store
    i32.const 1
  )
  (func $sfm_residual_cost_f64 (;26;) (param $res_ptr (;0;) i32) (result f64)
    (local $i i32)
    (local $offset i32)
    (local $value f64)
    (local $cost f64)
    f64.const 0.0
    local.set $cost
    i32.const 0
    local.set $i
    block $label0
      loop $label1
        local.get $i
        i32.const 10
        i32.ge_u
        br_if $label0
        local.get $i
        i32.const 3
        i32.shl
        local.set $offset
        local.get $res_ptr
        local.get $offset
        i32.add
        f64.load
        local.tee $value
        local.get $value
        f64.mul
        local.get $cost
        f64.add
        local.set $cost
        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $label1
      end $label1
    end $label0
    local.get $cost
  )
  (func $sfm_solve3x3_f64 (;27;) (param $a_ptr (;0;) i32) (param $b_ptr (;1;) i32) (param $out_ptr (;2;) i32) (result i32)
    (local $a00 f64)
    (local $a01 f64)
    (local $a02 f64)
    (local $a10 f64)
    (local $a11 f64)
    (local $a12 f64)
    (local $a20 f64)
    (local $a21 f64)
    (local $a22 f64)
    (local $b0 f64)
    (local $b1 f64)
    (local $b2 f64)
    (local $det f64)
    (local $dx f64)
    (local $dy f64)
    (local $dz f64)
    local.get $a_ptr
    f64.load
    local.set $a00
    local.get $a_ptr
    f64.load offset=8
    local.set $a01
    local.get $a_ptr
    f64.load offset=16
    local.set $a02
    local.get $a_ptr
    f64.load offset=24
    local.set $a10
    local.get $a_ptr
    f64.load offset=32
    local.set $a11
    local.get $a_ptr
    f64.load offset=40
    local.set $a12
    local.get $a_ptr
    f64.load offset=48
    local.set $a20
    local.get $a_ptr
    f64.load offset=56
    local.set $a21
    local.get $a_ptr
    f64.load offset=64
    local.set $a22
    local.get $b_ptr
    f64.load
    local.set $b0
    local.get $b_ptr
    f64.load offset=8
    local.set $b1
    local.get $b_ptr
    f64.load offset=16
    local.set $b2
    local.get $a00
    local.get $a11
    local.get $a22
    f64.mul
    local.get $a12
    local.get $a21
    f64.mul
    f64.sub
    f64.mul
    local.get $a01
    local.get $a10
    local.get $a22
    f64.mul
    local.get $a12
    local.get $a20
    f64.mul
    f64.sub
    f64.mul
    f64.sub
    local.get $a02
    local.get $a10
    local.get $a21
    f64.mul
    local.get $a11
    local.get $a20
    f64.mul
    f64.sub
    f64.mul
    f64.add
    local.tee $det
    f64.abs
    f64.const 1e-18
    f64.lt
    if
      i32.const 0
      return
    end
    local.get $b0
    local.get $a11
    local.get $a22
    f64.mul
    local.get $a12
    local.get $a21
    f64.mul
    f64.sub
    f64.mul
    local.get $a01
    local.get $b1
    local.get $a22
    f64.mul
    local.get $a12
    local.get $b2
    f64.mul
    f64.sub
    f64.mul
    f64.sub
    local.get $a02
    local.get $b1
    local.get $a21
    f64.mul
    local.get $a11
    local.get $b2
    f64.mul
    f64.sub
    f64.mul
    f64.add
    local.get $det
    f64.div
    local.set $dx
    local.get $a00
    local.get $b1
    local.get $a22
    f64.mul
    local.get $a12
    local.get $b2
    f64.mul
    f64.sub
    f64.mul
    local.get $b0
    local.get $a10
    local.get $a22
    f64.mul
    local.get $a12
    local.get $a20
    f64.mul
    f64.sub
    f64.mul
    f64.sub
    local.get $a02
    local.get $a10
    local.get $b2
    f64.mul
    local.get $b1
    local.get $a20
    f64.mul
    f64.sub
    f64.mul
    f64.add
    local.get $det
    f64.div
    local.set $dy
    local.get $a00
    local.get $a11
    local.get $b2
    f64.mul
    local.get $b1
    local.get $a21
    f64.mul
    f64.sub
    f64.mul
    local.get $a01
    local.get $a10
    local.get $b2
    f64.mul
    local.get $b1
    local.get $a20
    f64.mul
    f64.sub
    f64.mul
    f64.sub
    local.get $b0
    local.get $a10
    local.get $a21
    f64.mul
    local.get $a11
    local.get $a20
    f64.mul
    f64.sub
    f64.mul
    f64.add
    local.get $det
    f64.div
    local.set $dz
    local.get $out_ptr
    local.get $dx
    f64.store
    local.get $out_ptr
    i32.const 8
    i32.add
    local.get $dy
    f64.store
    local.get $out_ptr
    i32.const 16
    i32.add
    local.get $dz
    f64.store
    i32.const 1
  )
  (func $sfm_copy_f64 (;28;) (param $src (;0;) i32) (param $dst (;1;) i32) (param $count (;2;) i32)
    (local $i i32)
    block $label0
      loop $label1
        local.get $i
        local.get $count
        i32.ge_u
        br_if $label0
        local.get $dst
        local.get $i
        i32.const 3
        i32.shl
        i32.add
        local.get $src
        local.get $i
        i32.const 3
        i32.shl
        i32.add
        f64.load
        f64.store
        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $label1
      end $label1
    end $label0
  )
  (func $sfm_solve_fivepoint_chart_f64 (;29;) (param $chart_ptr (;0;) i32) (param $start_ptr (;1;) i32) (param $out_ptr (;2;) i32) (param $scratch_ptr (;3;) i32) (result i32)
    (local $res_ptr i32)
    (local $plus_res_ptr i32)
    (local $minus_res_ptr i32)
    (local $jac_ptr i32)
    (local $h_ptr i32)
    (local $g_ptr i32)
    (local $delta_ptr i32)
    (local $work_ptr i32)
    (local $v0 f64)
    (local $v1 f64)
    (local $v2 f64)
    (local $t0 f64)
    (local $t1 f64)
    (local $t2 f64)
    (local $lambda f64)
    (local $cost f64)
    (local $trial_cost f64)
    (local $step f64)
    (local $eps f64)
    (local $iter i32)
    (local $col i32)
    (local $row i32)
    (local $i i32)
    (local $j0 f64)
    (local $j1 f64)
    (local $j2 f64)
    (local $rv f64)
    local.get $scratch_ptr
    local.set $res_ptr
    local.get $scratch_ptr
    i32.const 80
    i32.add
    local.set $plus_res_ptr
    local.get $scratch_ptr
    i32.const 160
    i32.add
    local.set $minus_res_ptr
    local.get $scratch_ptr
    i32.const 240
    i32.add
    local.set $jac_ptr
    local.get $scratch_ptr
    i32.const 480
    i32.add
    local.set $h_ptr
    local.get $scratch_ptr
    i32.const 552
    i32.add
    local.set $g_ptr
    local.get $scratch_ptr
    i32.const 576
    i32.add
    local.set $delta_ptr
    local.get $scratch_ptr
    i32.const 608
    i32.add
    local.set $work_ptr
    local.get $start_ptr
    f64.load
    local.set $v0
    local.get $start_ptr
    f64.load offset=8
    local.set $v1
    local.get $start_ptr
    f64.load offset=16
    local.set $v2
    f64.const 0.001
    local.set $lambda
    local.get $chart_ptr
    local.get $v0
    local.get $v1
    local.get $v2
    local.get $res_ptr
    local.get $work_ptr
    call $sfm_fivepoint_residual_f64
    i32.eqz
    if
      i32.const 0
      return
    end
    local.get $res_ptr
    call $sfm_residual_cost_f64
    local.set $cost
    i32.const 0
    local.set $iter
    block $label0
      loop $label9
        local.get $iter
        i32.const 40
        i32.ge_u
        br_if $label0
        i32.const 0
        local.set $col
        block $label1
          loop $label4
            local.get $col
            i32.const 3
            i32.ge_u
            br_if $label1
            local.get $col
            i32.eqz
            if (result f64)
              local.get $v0
              f64.abs
            else
              local.get $col
              i32.const 1
              i32.eq
              if (result f64)
                local.get $v1
                f64.abs
              else
                local.get $v2
                f64.abs
              end
            end
            f64.const 1
            f64.add
            f64.const 0.00001
            f64.mul
            local.set $eps
            local.get $v0
            local.set $t0
            local.get $v1
            local.set $t1
            local.get $v2
            local.set $t2
            local.get $col
            i32.eqz
            if
              local.get $t0
              local.get $eps
              f64.add
              local.set $t0
            else
              local.get $col
              i32.const 1
              i32.eq
              if
                local.get $t1
                local.get $eps
                f64.add
                local.set $t1
              else
                local.get $t2
                local.get $eps
                f64.add
                local.set $t2
              end
            end
            local.get $chart_ptr
            local.get $t0
            local.get $t1
            local.get $t2
            local.get $plus_res_ptr
            local.get $work_ptr
            call $sfm_fivepoint_residual_f64
            drop
            local.get $v0
            local.set $t0
            local.get $v1
            local.set $t1
            local.get $v2
            local.set $t2
            local.get $col
            i32.eqz
            if
              local.get $t0
              local.get $eps
              f64.sub
              local.set $t0
            else
              local.get $col
              i32.const 1
              i32.eq
              if
                local.get $t1
                local.get $eps
                f64.sub
                local.set $t1
              else
                local.get $t2
                local.get $eps
                f64.sub
                local.set $t2
              end
            end
            local.get $chart_ptr
            local.get $t0
            local.get $t1
            local.get $t2
            local.get $minus_res_ptr
            local.get $work_ptr
            call $sfm_fivepoint_residual_f64
            drop
            i32.const 0
            local.set $row
            block $label2
              loop $label3
                local.get $row
                i32.const 10
                i32.ge_u
                br_if $label2
                local.get $jac_ptr
                local.get $row
                i32.const 3
                i32.mul
                local.get $col
                i32.add
                i32.const 3
                i32.shl
                i32.add
                local.get $plus_res_ptr
                local.get $row
                i32.const 3
                i32.shl
                i32.add
                f64.load
                local.get $minus_res_ptr
                local.get $row
                i32.const 3
                i32.shl
                i32.add
                f64.load
                f64.sub
                f64.const 2
                local.get $eps
                f64.mul
                f64.div
                f64.store
                local.get $row
                i32.const 1
                i32.add
                local.set $row
                br $label3
              end $label3
            end $label2
            local.get $col
            i32.const 1
            i32.add
            local.set $col
            br $label4
          end $label4
        end $label1
        i32.const 0
        local.set $i
        block $label5
          loop $label6
            local.get $i
            i32.const 9
            i32.ge_u
            br_if $label5
            local.get $h_ptr
            local.get $i
            i32.const 3
            i32.shl
            i32.add
            f64.const 0.0
            f64.store
            local.get $i
            i32.const 1
            i32.add
            local.set $i
            br $label6
          end $label6
        end $label5
        local.get $g_ptr
        f64.const 0.0
        f64.store
        local.get $g_ptr
        i32.const 8
        i32.add
        f64.const 0.0
        f64.store
        local.get $g_ptr
        i32.const 16
        i32.add
        f64.const 0.0
        f64.store
        i32.const 0
        local.set $row
        block $label7
          loop $label8
            local.get $row
            i32.const 10
            i32.ge_u
            br_if $label7
            local.get $jac_ptr
            local.get $row
            i32.const 24
            i32.mul
            i32.add
            f64.load
            local.set $j0
            local.get $jac_ptr
            local.get $row
            i32.const 24
            i32.mul
            i32.add
            f64.load offset=8
            local.set $j1
            local.get $jac_ptr
            local.get $row
            i32.const 24
            i32.mul
            i32.add
            f64.load offset=16
            local.set $j2
            local.get $res_ptr
            local.get $row
            i32.const 3
            i32.shl
            i32.add
            f64.load
            local.set $rv
            local.get $h_ptr
            local.get $h_ptr
            f64.load
            local.get $j0
            local.get $j0
            f64.mul
            f64.add
            f64.store
            local.get $h_ptr
            i32.const 8
            i32.add
            local.get $h_ptr
            f64.load offset=8
            local.get $j0
            local.get $j1
            f64.mul
            f64.add
            f64.store
            local.get $h_ptr
            i32.const 16
            i32.add
            local.get $h_ptr
            f64.load offset=16
            local.get $j0
            local.get $j2
            f64.mul
            f64.add
            f64.store
            local.get $h_ptr
            i32.const 24
            i32.add
            local.get $h_ptr
            f64.load offset=24
            local.get $j1
            local.get $j0
            f64.mul
            f64.add
            f64.store
            local.get $h_ptr
            i32.const 32
            i32.add
            local.get $h_ptr
            f64.load offset=32
            local.get $j1
            local.get $j1
            f64.mul
            f64.add
            f64.store
            local.get $h_ptr
            i32.const 40
            i32.add
            local.get $h_ptr
            f64.load offset=40
            local.get $j1
            local.get $j2
            f64.mul
            f64.add
            f64.store
            local.get $h_ptr
            i32.const 48
            i32.add
            local.get $h_ptr
            f64.load offset=48
            local.get $j2
            local.get $j0
            f64.mul
            f64.add
            f64.store
            local.get $h_ptr
            i32.const 56
            i32.add
            local.get $h_ptr
            f64.load offset=56
            local.get $j2
            local.get $j1
            f64.mul
            f64.add
            f64.store
            local.get $h_ptr
            i32.const 64
            i32.add
            local.get $h_ptr
            f64.load offset=64
            local.get $j2
            local.get $j2
            f64.mul
            f64.add
            f64.store
            local.get $g_ptr
            local.get $g_ptr
            f64.load
            local.get $j0
            local.get $rv
            f64.mul
            f64.add
            f64.store
            local.get $g_ptr
            i32.const 8
            i32.add
            local.get $g_ptr
            f64.load offset=8
            local.get $j1
            local.get $rv
            f64.mul
            f64.add
            f64.store
            local.get $g_ptr
            i32.const 16
            i32.add
            local.get $g_ptr
            f64.load offset=16
            local.get $j2
            local.get $rv
            f64.mul
            f64.add
            f64.store
            local.get $row
            i32.const 1
            i32.add
            local.set $row
            br $label8
          end $label8
        end $label7
        local.get $h_ptr
        local.get $h_ptr
        f64.load
        local.get $lambda
        local.get $h_ptr
        f64.load
        f64.const 1e-9
        f64.add
        f64.mul
        f64.add
        f64.store
        local.get $h_ptr
        i32.const 32
        i32.add
        local.get $h_ptr
        f64.load offset=32
        local.get $lambda
        local.get $h_ptr
        f64.load offset=32
        f64.const 1e-9
        f64.add
        f64.mul
        f64.add
        f64.store
        local.get $h_ptr
        i32.const 64
        i32.add
        local.get $h_ptr
        f64.load offset=64
        local.get $lambda
        local.get $h_ptr
        f64.load offset=64
        f64.const 1e-9
        f64.add
        f64.mul
        f64.add
        f64.store
        local.get $g_ptr
        local.get $g_ptr
        f64.load
        f64.neg
        f64.store
        local.get $g_ptr
        i32.const 8
        i32.add
        local.get $g_ptr
        f64.load offset=8
        f64.neg
        f64.store
        local.get $g_ptr
        i32.const 16
        i32.add
        local.get $g_ptr
        f64.load offset=16
        f64.neg
        f64.store
        local.get $h_ptr
        local.get $g_ptr
        local.get $delta_ptr
        call $sfm_solve3x3_f64
        i32.eqz
        if
          local.get $lambda
          f64.const 10
          f64.mul
          local.set $lambda
          local.get $iter
          i32.const 1
          i32.add
          local.set $iter
          br $label9
        end
        local.get $delta_ptr
        f64.load
        local.get $delta_ptr
        f64.load
        f64.mul
        local.get $delta_ptr
        f64.load offset=8
        local.get $delta_ptr
        f64.load offset=8
        f64.mul
        f64.add
        local.get $delta_ptr
        f64.load offset=16
        local.get $delta_ptr
        f64.load offset=16
        f64.mul
        f64.add
        f64.sqrt
        local.tee $step
        f64.const 1e-10
        f64.lt
        if
          br $label0
        end
        local.get $v0
        local.get $delta_ptr
        f64.load
        f64.add
        local.set $t0
        local.get $v1
        local.get $delta_ptr
        f64.load offset=8
        f64.add
        local.set $t1
        local.get $v2
        local.get $delta_ptr
        f64.load offset=16
        f64.add
        local.set $t2
        local.get $chart_ptr
        local.get $t0
        local.get $t1
        local.get $t2
        local.get $plus_res_ptr
        local.get $work_ptr
        call $sfm_fivepoint_residual_f64
        i32.eqz
        if
          local.get $lambda
          f64.const 8
          f64.mul
          f64.const 100000000
          f64.min
          local.set $lambda
          local.get $iter
          i32.const 1
          i32.add
          local.set $iter
          br $label9
        end
        local.get $plus_res_ptr
        call $sfm_residual_cost_f64
        local.set $trial_cost
        local.get $trial_cost
        local.get $cost
        f64.lt
        if
          local.get $t0
          local.set $v0
          local.get $t1
          local.set $v1
          local.get $t2
          local.set $v2
          local.get $trial_cost
          local.set $cost
          local.get $plus_res_ptr
          local.get $res_ptr
          i32.const 10
          call $sfm_copy_f64
          local.get $lambda
          f64.const 0.35
          f64.mul
          f64.const 1e-8
          f64.max
          local.set $lambda
          local.get $cost
          f64.const 1e-14
          f64.lt
          if
            br $label0
          end
        else
          local.get $lambda
          f64.const 8
          f64.mul
          f64.const 100000000
          f64.min
          local.set $lambda
        end
        local.get $iter
        i32.const 1
        i32.add
        local.set $iter
        br $label9
      end $label9
    end $label0
    local.get $cost
    f64.const 1e-8
    f64.gt
    if
      i32.const 0
      return
    end
    local.get $chart_ptr
    local.get $v0
    local.get $v1
    local.get $v2
    local.get $out_ptr
    call $sfm_compose_fivepoint_e_f64
  )
  (func $sfm_solve_five_point_charts_f64 (;30;) (export "sfm_solve_five_point_charts_f64") (param $charts_ptr (;0;) i32) (param $chart_count (;1;) i32) (param $starts_ptr (;2;) i32) (param $start_count (;3;) i32) (param $out_ptr (;4;) i32) (param $max_out (;5;) i32) (result i32)
    (local $chart i32)
    (local $start i32)
    (local $out_count i32)
    (local $chart_ptr i32)
    (local $start_ptr i32)
    (local $candidate_ptr i32)
    (local $scratch_ptr i32)
    local.get $chart_count
    i32.const 0
    i32.le_s
    if
      i32.const 0
      return
    end
    local.get $start_count
    i32.const 0
    i32.le_s
    if
      i32.const 0
      return
    end
    local.get $max_out
    i32.const 0
    i32.le_s
    if
      i32.const 0
      return
    end
    i32.const 768
    i32.const 16
    call $sfm_alloc
    local.set $scratch_ptr
    i32.const 0
    local.set $chart
    i32.const 0
    local.set $out_count
    block $label0
      loop $label3
        local.get $chart
        local.get $chart_count
        i32.ge_u
        br_if $label0
        local.get $out_count
        local.get $max_out
        i32.ge_u
        br_if $label0
        local.get $charts_ptr
        local.get $chart
        i32.const 288
        i32.mul
        i32.add
        local.set $chart_ptr
        i32.const 0
        local.set $start
        block $label1
          loop $label2
            local.get $start
            local.get $start_count
            i32.ge_u
            br_if $label1
            local.get $out_count
            local.get $max_out
            i32.ge_u
            br_if $label1
            local.get $starts_ptr
            local.get $start
            i32.const 24
            i32.mul
            i32.add
            local.set $start_ptr
            local.get $out_ptr
            local.get $out_count
            i32.const 72
            i32.mul
            i32.add
            local.set $candidate_ptr
            local.get $chart_ptr
            local.get $start_ptr
            local.get $candidate_ptr
            local.get $scratch_ptr
            call $sfm_solve_fivepoint_chart_f64
            if
              local.get $out_count
              i32.const 1
              i32.add
              local.set $out_count
            end
            local.get $start
            i32.const 1
            i32.add
            local.set $start
            br $label2
          end $label2
        end $label1
        local.get $chart
        i32.const 1
        i32.add
        local.set $chart
        br $label3
      end $label3
    end $label0
    local.get $out_count
  )
  (func $sfm_match_brief_directional_u32 (;31;) (export "sfm_match_brief_directional_u32") (param $src_desc_ptr (;0;) i32) (param $src_count (;1;) i32) (param $dst_desc_ptr (;2;) i32) (param $dst_count (;3;) i32) (param $max_distance (;4;) i32) (param $ratio (;5;) f32) (param $out_best_ptr (;6;) i32) (param $out_distance_ptr (;7;) i32) (result i32)
    (local $i i32)
    (local $j i32)
    (local $w i32)
    (local $src_base i32)
    (local $dst_base i32)
    (local $d i32)
    (local $best i32)
    (local $second i32)
    (local $best_j i32)
    i32.const 0
    local.set $i
    block $label0
      loop $label5
        local.get $i
        local.get $src_count
        i32.ge_u
        br_if $label0
        local.get $out_best_ptr
        local.get $i
        i32.const 2
        i32.shl
        i32.add
        i32.const -1
        i32.store
        local.get $out_distance_ptr
        local.get $i
        i32.const 2
        i32.shl
        i32.add
        i32.const 0
        i32.store
        local.get $src_desc_ptr
        local.get $i
        i32.const 5
        i32.shl
        i32.add
        local.set $src_base
        local.get $max_distance
        i32.const 1
        i32.add
        local.set $best
        local.get $max_distance
        i32.const 1
        i32.add
        local.set $second
        i32.const -1
        local.set $best_j
        i32.const 0
        local.set $j
        block $label1
          loop $label4
            local.get $j
            local.get $dst_count
            i32.ge_u
            br_if $label1
            local.get $dst_desc_ptr
            local.get $j
            i32.const 5
            i32.shl
            i32.add
            local.set $dst_base
            i32.const 0
            local.set $d
            i32.const 0
            local.set $w
            block $label2
              loop $label3
                local.get $w
                i32.const 8
                i32.ge_u
                br_if $label2
                local.get $d
                local.get $src_base
                local.get $w
                i32.const 2
                i32.shl
                i32.add
                i32.load
                local.get $dst_base
                local.get $w
                i32.const 2
                i32.shl
                i32.add
                i32.load
                i32.xor
                i32.popcnt
                i32.add
                local.set $d
                local.get $d
                local.get $second
                i32.ge_u
                br_if $label2
                local.get $w
                i32.const 1
                i32.add
                local.set $w
                br $label3
              end $label3
            end $label2
            local.get $d
            local.get $best
            i32.lt_u
            if
              local.get $best
              local.set $second
              local.get $d
              local.set $best
              local.get $j
              local.set $best_j
            else
              local.get $d
              local.get $second
              i32.lt_u
              if
                local.get $d
                local.set $second
              end
            end
            local.get $j
            i32.const 1
            i32.add
            local.set $j
            br $label4
          end $label4
        end $label1
        local.get $best_j
        i32.const 0
        i32.ge_s
        if
          local.get $best
          local.get $max_distance
          i32.le_u
          if
            local.get $best
            f32.convert_i32_u
            local.get $second
            f32.convert_i32_u
            local.get $ratio
            f32.mul
            f32.lt
            if
              local.get $out_best_ptr
              local.get $i
              i32.const 2
              i32.shl
              i32.add
              local.get $best_j
              i32.store
              local.get $out_distance_ptr
              local.get $i
              i32.const 2
              i32.shl
              i32.add
              local.get $best
              i32.store
            end
          end
        end
        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $label5
      end $label5
    end $label0
    local.get $src_count
  )
)